import type { SessionUser } from '../shared/wired.js';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser | null;
    }
  }
}

export {};
