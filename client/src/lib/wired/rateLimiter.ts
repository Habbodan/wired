export type LimitKind = 'read' | 'list' | 'profile' | 'write' | 'bulkDelete' | 'batch';

interface Rule {
  perMinute: number;
  burst: number;
}

const BURST_WINDOW_MS = 10_000;
const SUSTAINED_WINDOW_MS = 60_000;

export const ROOM_LIMITS: Record<LimitKind, Rule> = {
  read: { perMinute: 300, burst: 60 },
  list: { perMinute: 120, burst: 20 },
  profile: { perMinute: 120, burst: 20 },
  write: { perMinute: 120, burst: 30 },
  bulkDelete: { perMinute: 10, burst: 5 },
  batch: { perMinute: 30, burst: 30 },
};

export class RateLimitedError extends Error {
  constructor(readonly retryAfterMs: number) {
    super('rate_limited');
  }
}

export class RoomRateLimiter {
  private readonly history = new Map<LimitKind, number[]>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxWaitMs = 3000,
  ) {}

  waitTime(kind: LimitKind): number {
    const { perMinute, burst } = ROOM_LIMITS[kind];
    const now = this.now();
    const log = this.prune(kind, now);

    const waitFor = (windowMs: number, limit: number) => {
      const inWindow = log.filter((at) => at > now - windowMs);
      if (inWindow.length < limit) return 0;
      return (inWindow[inWindow.length - limit] ?? now) + windowMs - now;
    };

    return Math.max(waitFor(BURST_WINDOW_MS, burst), waitFor(SUSTAINED_WINDOW_MS, perMinute));
  }

  async acquire(kind: LimitKind): Promise<void> {
    const wait = this.waitTime(kind);
    if (wait > this.maxWaitMs) throw new RateLimitedError(wait);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    this.prune(kind, this.now()).push(this.now());
  }

  private prune(kind: LimitKind, now: number): number[] {
    const log = (this.history.get(kind) ?? []).filter((at) => at > now - SUSTAINED_WINDOW_MS);
    this.history.set(kind, log);
    return log;
  }
}

const limiters = new Map<string, RoomRateLimiter>();

export function limiterForRoom(hotel: string, roomId: number): RoomRateLimiter {
  const key = `${hotel}:${roomId}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new RoomRateLimiter();
    limiters.set(key, limiter);
  }
  return limiter;
}
