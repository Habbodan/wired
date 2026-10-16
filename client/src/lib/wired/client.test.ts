import { describe, expect, it, vi } from 'vitest';
import { createWiredClient, MissingKeyError, WiredApiError } from './client';
import { RoomRateLimiter } from './rateLimiter';
import { apiToInGameId, inGameToApiId, toApiEntityId, toGameEntityId } from './ids';

function jsonResponse(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function setup(
  response: Response,
  keys = { readKey: 'r'.repeat(43), writeKey: null as string | null },
) {
  const fetchImpl = vi.fn(async () => response);
  const onActivity = vi.fn();
  const client = createWiredClient({
    hotel: 'tr',
    roomId: 123,
    ...keys,
    limiter: new RoomRateLimiter(),
    fetchImpl: fetchImpl as unknown as typeof fetch,
    onActivity,
  });
  return { client, fetchImpl, onActivity };
}

describe('createWiredClient', () => {
  it('reads a variable from the hotel the workspace belongs to', async () => {
    const { client, fetchImpl } = setup(jsonResponse(200, { value: '5' }));

    await client.getValue({ scope: 'user', targetKind: 'users', entityId: '44' }, 'points');

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe(
      'https://www.habbo.com.tr/api/public/rooms/123/variables/user/points/users/44',
    );
    expect(init.headers).toMatchObject({ 'X-Wired-Read-Key': 'r'.repeat(43) });
    expect(init.credentials).toBe('omit');
  });

  it('encodes path segments', async () => {
    const { client, fetchImpl } = setup(jsonResponse(200, { value: '1' }));

    await client.getGlobal('a@b');

    const [url] = fetchImpl.mock.calls[0] as unknown as [URL];
    expect(url.pathname).toBe('/api/public/rooms/123/variables/global/a%40b');
  });

  it('refuses writes without a write key before calling the API', async () => {
    const { client, fetchImpl } = setup(jsonResponse(200, {}));

    await expect(client.updateGlobal('score', '1')).rejects.toBeInstanceOf(MissingKeyError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('surfaces API error codes', async () => {
    const { client } = setup(jsonResponse(403, { error: 'forbidden' }));

    await expect(client.listVariables()).rejects.toEqual(new WiredApiError(403, 'forbidden'));
  });

  it('logs activity without leaking keys', async () => {
    const { client, onActivity } = setup(jsonResponse(200, { items: [], page: 1, size: 50 }));

    await client.listValues('furni', 'hp', 'furni', { page: 2, size: 50 });

    const entry = onActivity.mock.calls[0]![0];
    expect(entry).toMatchObject({
      method: 'GET',
      path: '/variables/furni/hp/furni?page=2&size=50',
      status: 200,
    });
    expect(JSON.stringify(entry)).not.toContain('rrrr');
  });

  it('normalises profile targets', async () => {
    const { client } = setup(
      jsonResponse(200, { variables: { hp: { value: '3' } }, user: { id: 9, name: 'Frank' } }),
    );

    const profile = await client.findUserProfile({ name: 'Frank' });

    expect(profile.target).toEqual({ id: 9, name: 'Frank' });
    expect(profile.variables.hp?.value).toBe('3');
  });
});

describe('id conversion', () => {
  it.each([
    ['furni', 812, 812],
    ['wall-items', -77, 77],
    ['furni-bc', 0x7fffffff - 0xffff + 10, 10],
  ] as const)('converts %s ids both ways', (kind, inGame, api) => {
    expect(inGameToApiId(kind, inGame)).toBe(api);
    expect(apiToInGameId(kind, api)).toBe(inGame);
  });

  it('turns in-game ids from the lookup forms into api ids', () => {
    expect(toApiEntityId('wall-items', '-77')).toBe('77');
    expect(toApiEntityId('furni', '812')).toBe('812');
    expect(toApiEntityId('users', '9')).toBe('9');
    expect(toApiEntityId('users', '-9')).toBeNull();
    expect(toApiEntityId('wall-items', '77')).toBeNull();
    expect(toApiEntityId('furni', 'abc')).toBeNull();
  });

  it('shows api ids as they appear in game', () => {
    expect(toGameEntityId('wall-items', '77')).toBe('-77');
    expect(toGameEntityId('furni-bc', '10')).toBe(String(0x7fffffff - 0xffff + 10));
    expect(toGameEntityId('users', '9')).toBe('9');
  });
});
