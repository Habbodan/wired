import { z } from 'zod';
import {
  workspaceKeysSchema,
  workspaceMetaSchema,
  workspaceStateSchema,
  type Workspace,
  type WorkspaceKeys,
  type WorkspaceSummary,
  type WorkspaceUpsert,
} from '@shared/wired';
import { api, ApiError } from '@/lib/http';
import { readJson, readString, removeItem, writeJson, writeString } from '@/lib/storage';

export interface WorkspaceRepository {
  readonly kind: 'local' | 'account';
  list(): Promise<WorkspaceSummary[]>;
  get(id: string): Promise<Workspace | null>;
  save(id: string, input: WorkspaceUpsert): Promise<Workspace>;
  remove(id: string): Promise<void>;
}

const WORKSPACES_KEY = 'wired.workspaces.v1';
const KEYS_KEY = 'wired.keys.v1';
const REMEMBER_KEY = 'wired.rememberKeys';

const localRecordSchema = workspaceMetaSchema.extend({
  id: z.uuid(),
  state: workspaceStateSchema,
  updatedAt: z.iso.datetime(),
});
type LocalRecord = z.infer<typeof localRecordSchema>;

const keyStoreSchema = z.record(z.string(), workspaceKeysSchema);
type KeyStore = z.infer<typeof keyStoreSchema>;

export function remembersKeys(): boolean {
  return readString('local', REMEMBER_KEY) === 'true';
}

export function setRememberKeys(remember: boolean): void {
  const keys = readKeys();
  removeItem('local', KEYS_KEY);
  removeItem('session', KEYS_KEY);
  writeString('local', REMEMBER_KEY, String(remember));
  writeJson(remember ? 'local' : 'session', KEYS_KEY, keys);
}

function readRecords(): LocalRecord[] {
  const parsed = z.array(z.unknown()).safeParse(readJson('local', WORKSPACES_KEY));
  if (!parsed.success) return [];
  return parsed.data.flatMap((item) => {
    const record = localRecordSchema.safeParse(item);
    return record.success ? [record.data] : [];
  });
}

function readKeys(): KeyStore {
  const parsed = keyStoreSchema.safeParse(
    readJson(remembersKeys() ? 'local' : 'session', KEYS_KEY),
  );
  return parsed.success ? parsed.data : {};
}

function writeKeys(keys: KeyStore): void {
  writeJson(remembersKeys() ? 'local' : 'session', KEYS_KEY, keys);
}

function toSummary(record: LocalRecord, keys: WorkspaceKeys | undefined): WorkspaceSummary {
  return {
    id: record.id,
    name: record.name,
    hotel: record.hotel,
    roomId: record.roomId,
    hasReadKey: Boolean(keys?.readKey),
    hasWriteKey: Boolean(keys?.writeKey),
    updatedAt: record.updatedAt,
  };
}

export const localRepository: WorkspaceRepository = {
  kind: 'local',

  async list() {
    const keys = readKeys();
    return readRecords()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((record) => toSummary(record, keys[record.id]));
  },

  async get(id) {
    const record = readRecords().find((item) => item.id === id);
    if (!record) return null;
    const keys = readKeys()[id] ?? { readKey: null, writeKey: null };
    return { ...toSummary(record, keys), ...keys, state: record.state };
  },

  async save(id, input) {
    const record: LocalRecord = {
      id,
      name: input.name,
      hotel: input.hotel,
      roomId: input.roomId,
      state: input.state,
      updatedAt: new Date().toISOString(),
    };
    writeJson('local', WORKSPACES_KEY, [record, ...readRecords().filter((item) => item.id !== id)]);

    const keys = readKeys();
    const current = keys[id] ?? { readKey: null, writeKey: null };
    keys[id] = {
      readKey: input.readKey === undefined ? current.readKey : input.readKey,
      writeKey: input.writeKey === undefined ? current.writeKey : input.writeKey,
    };
    writeKeys(keys);

    return { ...toSummary(record, keys[id]), ...keys[id], state: record.state };
  },

  async remove(id) {
    writeJson(
      'local',
      WORKSPACES_KEY,
      readRecords().filter((item) => item.id !== id),
    );
    writeKeys(Object.fromEntries(Object.entries(readKeys()).filter(([key]) => key !== id)));
  },
};

export const accountRepository: WorkspaceRepository = {
  kind: 'account',

  async list() {
    return (await api<{ workspaces: WorkspaceSummary[] }>('/api/workspaces')).workspaces;
  },

  async get(id) {
    try {
      return (await api<{ workspace: Workspace }>(`/api/workspaces/${id}`)).workspace;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async save(id, input) {
    return (
      await api<{ workspace: Workspace }>(`/api/workspaces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    ).workspace;
  },

  async remove(id) {
    await api<undefined>(`/api/workspaces/${id}`, { method: 'DELETE' });
  },
};
