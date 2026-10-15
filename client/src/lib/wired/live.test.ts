/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { HOTEL_IDS, type HotelId } from '@shared/hotels';
import { createWiredClient, WiredApiError } from './client';

const hotel = process.env.WIRED_TEST_HOTEL as HotelId | undefined;
const roomId = Number(process.env.WIRED_TEST_ROOM);
const readKey = process.env.WIRED_TEST_READ_KEY ?? null;
const enabled = Boolean(hotel && HOTEL_IDS.includes(hotel) && roomId && readKey);

describe.runIf(enabled)('live Wired API', () => {
  const client = () =>
    createWiredClient({ hotel: hotel as HotelId, roomId, readKey, writeKey: null });

  it('lists the room variables', async () => {
    const variables = await client().listVariables();
    expect(variables).toMatchObject({
      users: expect.any(Array),
      furni: expect.any(Array),
      global: expect.any(Array),
    });
  });

  it('pages values and resolves their targets', async () => {
    const variables = await client().listVariables();
    const name = variables.users[0];
    if (!name) return;

    const page = await client().listValues('user', name, 'users', { size: 5 });
    for (const item of page.items) {
      expect(item.variable.value).toMatch(/^-?\d+$/);
    }
    const { count } = await client().countValues('user', name, 'users');
    expect(count).toBeGreaterThanOrEqual(page.items.length);
  });

  it('reports unknown variables with an error code', async () => {
    await expect(client().getGlobal('definitely_missing_variable')).rejects.toBeInstanceOf(
      WiredApiError,
    );
  });
});
