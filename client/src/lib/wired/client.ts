import { hotelOrigin, type HotelId } from '@shared/hotels';
import type { ActivityEntry } from '@shared/wired';
import { targetOf } from './targets';
import { limiterForRoom, type LimitKind, type RoomRateLimiter } from './rateLimiter';
import type {
  BatchOperation,
  BatchResult,
  EntityProfile,
  EntityRef,
  EntityScope,
  ListQuery,
  PagedValues,
  RoomVariables,
  UserProfileLookup,
  VariableMap,
  WiredVariable,
} from './types';

const REQUEST_TIMEOUT_MS = 10_000;
type KeyKind = 'read' | 'write' | 'both';
type Method = ActivityEntry['method'];

export class WiredApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export class MissingKeyError extends Error {
  constructor(readonly key: 'read' | 'write') {
    super(`missing_${key}_key`);
  }
}

export interface WiredClientOptions {
  hotel: HotelId;
  roomId: number;
  readKey: string | null;
  writeKey: string | null;
  limiter?: RoomRateLimiter;
  fetchImpl?: typeof fetch;
  onActivity?: (entry: Omit<ActivityEntry, 'id' | 'at'>) => void;
}

interface CallOptions {
  limit: LimitKind;
  key: KeyKind;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

const segment = encodeURIComponent;

export function entityPath({ scope, targetKind, entityId }: EntityRef, variable: string): string {
  return `/variables/${scope}/${segment(variable)}/${targetKind}/${segment(entityId)}`;
}

export function createWiredClient(options: WiredClientOptions) {
  const base = `${hotelOrigin(options.hotel)}/api/public/rooms/${options.roomId}`;
  const limiter = options.limiter ?? limiterForRoom(options.hotel, options.roomId);
  const fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);

  function headersFor(key: KeyKind): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (key === 'read' || key === 'both') {
      if (!options.readKey) throw new MissingKeyError('read');
      headers['X-Wired-Read-Key'] = options.readKey;
    }
    if (key === 'write' || key === 'both') {
      if (!options.writeKey) throw new MissingKeyError('write');
      headers['X-Wired-Write-Key'] = options.writeKey;
    }
    return headers;
  }

  async function call<T>(method: Method, path: string, { limit, key, body, query }: CallOptions) {
    const headers = headersFor(key);
    await limiter.acquire(limit);

    const url = new URL(base + path);
    for (const [name, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(name, String(value));
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const startedAt = performance.now();
    let status = 0;
    try {
      const response = await fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      status = response.status;

      if (response.status === 204) return undefined as T;
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const code =
          payload && typeof payload === 'object' && 'error' in payload
            ? String(payload.error)
            : 'error';
        throw new WiredApiError(response.status, code);
      }
      return payload as T;
    } finally {
      options.onActivity?.({
        method,
        path: url.pathname.replace(/^\/api\/public\/rooms\/\d+/, '') + url.search,
        status,
        durationMs: Math.round(performance.now() - startedAt),
      });
    }
  }

  function toProfile(payload: Record<string, unknown>): EntityProfile {
    return { variables: (payload.variables ?? {}) as VariableMap, target: targetOf(payload) };
  }

  const profilePath = (scope: EntityScope, targetKind: string, entityId: string) =>
    `/variables_profile/${scope}/${targetKind}/${segment(entityId)}`;

  return {
    hasReadKey: Boolean(options.readKey),
    hasWriteKey: Boolean(options.writeKey),

    listVariables: () => call<RoomVariables>('GET', '/variables', { limit: 'list', key: 'read' }),

    getValue: (ref: EntityRef, variable: string) =>
      call<WiredVariable>('GET', entityPath(ref, variable), { limit: 'read', key: 'read' }),

    setValue: (ref: EntityRef, variable: string, value: string) =>
      call<WiredVariable>('PUT', entityPath(ref, variable), {
        limit: 'write',
        key: 'write',
        body: { value },
      }),

    updateValue: (ref: EntityRef, variable: string, value: string) =>
      call<WiredVariable>('PATCH', entityPath(ref, variable), {
        limit: 'write',
        key: 'write',
        body: { value },
      }),

    deleteValue: (ref: EntityRef, variable: string) =>
      call<undefined>('DELETE', entityPath(ref, variable), { limit: 'write', key: 'write' }),

    listValues: (scope: EntityScope, variable: string, targetKind: string, query: ListQuery = {}) =>
      call<PagedValues>('GET', `/variables/${scope}/${segment(variable)}/${targetKind}`, {
        limit: 'list',
        key: 'read',
        query: {
          order_by: query.orderBy,
          order_dir: query.orderDir,
          page: query.page,
          size: query.size,
        },
      }),

    countValues: (scope: EntityScope, variable: string, targetKind: string) =>
      call<{ count: number }>(
        'GET',
        `/variables/${scope}/${segment(variable)}/${targetKind}/count`,
        {
          limit: 'list',
          key: 'read',
        },
      ),

    bulkDelete: (variables: string[]) =>
      call<undefined>('POST', '/variables/bulk-delete', {
        limit: 'bulkDelete',
        key: 'write',
        body: { variables },
      }),

    batch: (scope: EntityScope, variable: string, requests: BatchOperation[]) =>
      call<{ results: BatchResult[] }>('POST', `/variables/${scope}/${segment(variable)}/batch`, {
        limit: 'batch',
        key: 'both',
        body: { requests },
      }),

    getGlobal: (variable: string) =>
      call<WiredVariable>('GET', `/variables/global/${segment(variable)}`, {
        limit: 'read',
        key: 'read',
      }),

    updateGlobal: (variable: string, value: string) =>
      call<WiredVariable>('PATCH', `/variables/global/${segment(variable)}`, {
        limit: 'write',
        key: 'write',
        body: { value },
      }),

    findUserProfile: async (lookup: UserProfileLookup) =>
      toProfile(
        await call('GET', '/variables_profile/user/users', {
          limit: 'profile',
          key: 'read',
          query: 'name' in lookup ? { name: lookup.name } : { unique_id: lookup.uniqueId },
        }),
      ),

    getProfile: async (scope: EntityScope, targetKind: string, entityId: string) =>
      toProfile(
        await call('GET', profilePath(scope, targetKind, entityId), {
          limit: 'profile',
          key: 'read',
        }),
      ),

    patchProfile: async (
      scope: EntityScope,
      targetKind: string,
      entityId: string,
      variables: Record<string, string | null>,
    ) =>
      toProfile(
        await call('PATCH', profilePath(scope, targetKind, entityId), {
          limit: 'batch',
          key: 'write',
          body: { variables },
        }),
      ),

    deleteUserProfile: (targetKind: string, entityId: string) =>
      call<undefined>('DELETE', profilePath('user', targetKind, entityId), {
        limit: 'write',
        key: 'write',
      }),

    getGlobalProfile: async () =>
      toProfile(await call('GET', '/variables_profile/global', { limit: 'profile', key: 'read' })),

    patchGlobalProfile: async (variables: Record<string, string | null>) =>
      toProfile(
        await call('PATCH', '/variables_profile/global', {
          limit: 'batch',
          key: 'write',
          body: { variables },
        }),
      ),
  };
}

export type WiredClient = ReturnType<typeof createWiredClient>;
