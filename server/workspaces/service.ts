import type { Prisma, PrismaClient, Workspace as WorkspaceRow } from '@prisma/client';
import type { HotelId } from '../../shared/hotels.js';
import {
  workspaceStateSchema,
  type Workspace,
  type WorkspaceSummary,
  type WorkspaceUpsert,
} from '../../shared/wired.js';
import type { Sealer } from '../lib/crypto.js';
import { HttpError } from '../http/errors.js';

export const MAX_WORKSPACES_PER_USER = 50;

type KeyField = 'readKey' | 'writeKey';

export interface WorkspaceService {
  list(userId: string): Promise<WorkspaceSummary[]>;
  get(userId: string, id: string): Promise<Workspace | null>;
  upsert(userId: string, id: string, input: WorkspaceUpsert): Promise<Workspace>;
  remove(userId: string, id: string): Promise<boolean>;
}

export function createWorkspaceService(prisma: PrismaClient, sealer: Sealer): WorkspaceService {
  const keyContext = (row: Pick<WorkspaceRow, 'userId' | 'id'>, field: KeyField) =>
    `workspace:${row.userId}:${row.id}:${field}`;

  const summarize = (row: WorkspaceRow): WorkspaceSummary => ({
    id: row.id,
    name: row.name,
    hotel: row.hotel as HotelId,
    roomId: Number(row.roomId),
    hasReadKey: row.readKey !== null,
    hasWriteKey: row.writeKey !== null,
    updatedAt: row.updatedAt.toISOString(),
  });

  const reveal = (row: WorkspaceRow, field: KeyField) => {
    const sealed = row[field];
    return sealed === null ? null : sealer.open(sealed, keyContext(row, field));
  };

  const toWorkspace = (row: WorkspaceRow): Workspace => ({
    ...summarize(row),
    readKey: reveal(row, 'readKey'),
    writeKey: reveal(row, 'writeKey'),
    state: workspaceStateSchema.parse(row.state),
  });

  const sealedKey = (
    userId: string,
    id: string,
    field: KeyField,
    value: string | null | undefined,
  ) => {
    if (value === undefined) return undefined;
    return value === null ? null : sealer.seal(value, keyContext({ userId, id }, field));
  };

  return {
    async list(userId) {
      const rows = await prisma.workspace.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
      return rows.map(summarize);
    },

    async get(userId, id) {
      const row = await prisma.workspace.findUnique({ where: { userId_id: { userId, id } } });
      return row ? toWorkspace(row) : null;
    },

    async upsert(userId, id, input) {
      const readKey = sealedKey(userId, id, 'readKey', input.readKey);
      const writeKey = sealedKey(userId, id, 'writeKey', input.writeKey);
      const fields = {
        name: input.name,
        hotel: input.hotel,
        roomId: BigInt(input.roomId),
        state: input.state as Prisma.InputJsonObject,
      };

      const row = await prisma.$transaction(async (tx) => {
        const exists = await tx.workspace.count({ where: { userId, id } });
        if (
          !exists &&
          (await tx.workspace.count({ where: { userId } })) >= MAX_WORKSPACES_PER_USER
        ) {
          throw new HttpError(409, 'workspace_limit_reached');
        }
        return tx.workspace.upsert({
          where: { userId_id: { userId, id } },
          update: { ...fields, readKey, writeKey },
          create: { ...fields, userId, id, readKey: readKey ?? null, writeKey: writeKey ?? null },
        });
      });

      return toWorkspace(row);
    },

    async remove(userId, id) {
      const { count } = await prisma.workspace.deleteMany({ where: { userId, id } });
      return count > 0;
    },
  };
}
