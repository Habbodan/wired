import { describe, expect, it } from 'vitest';
import { RateLimitedError, RoomRateLimiter } from './rateLimiter';

function clock(start = 0) {
  let now = start;
  return { now: () => now, advance: (ms: number) => (now += ms) };
}

describe('RoomRateLimiter', () => {
  it('allows a full burst and then asks to wait for the burst window', async () => {
    const time = clock();
    const limiter = new RoomRateLimiter(time.now, 0);

    for (let i = 0; i < 5; i++) await limiter.acquire('bulkDelete');

    expect(limiter.waitTime('bulkDelete')).toBe(10_000);
    await expect(limiter.acquire('bulkDelete')).rejects.toBeInstanceOf(RateLimitedError);

    time.advance(10_000);
    expect(limiter.waitTime('bulkDelete')).toBe(0);
  });

  it('enforces the sustained per-minute limit across bursts', async () => {
    const time = clock();
    const limiter = new RoomRateLimiter(time.now, 0);

    for (let burst = 0; burst < 2; burst++) {
      for (let i = 0; i < 5; i++) await limiter.acquire('bulkDelete');
      time.advance(10_000);
    }

    expect(limiter.waitTime('bulkDelete')).toBe(40_000);
  });

  it('tracks each kind separately', async () => {
    const time = clock();
    const limiter = new RoomRateLimiter(time.now, 0);

    for (let i = 0; i < 5; i++) await limiter.acquire('bulkDelete');

    expect(limiter.waitTime('read')).toBe(0);
  });
});
