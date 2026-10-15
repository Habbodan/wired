import type { CookieOptions, Request, RequestHandler } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { SessionUser } from '../../shared/wired.js';
import { randomToken, sha256Hex } from '../lib/crypto.js';
import { HttpError } from '../http/errors.js';

const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

export interface SessionStore {
  create(userId: string): Promise<string>;
  resolve(token: string): Promise<SessionUser | null>;
  revoke(token: string): Promise<void>;
}

export function createSessionStore(prisma: PrismaClient, ttlMs: number): SessionStore {
  return {
    async create(userId) {
      const token = randomToken(32);
      await prisma.session.create({
        data: { tokenHash: sha256Hex(token), userId, expiresAt: new Date(Date.now() + ttlMs) },
      });
      return token;
    },

    async resolve(token) {
      const tokenHash = sha256Hex(token);
      const session = await prisma.session.findUnique({
        where: { tokenHash },
        include: { user: { select: { id: true, username: true, hotel: true } } },
      });
      if (!session) return null;

      const now = Date.now();
      if (session.expiresAt.getTime() <= now) {
        await prisma.session.deleteMany({ where: { tokenHash } });
        return null;
      }
      if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
        await prisma.session.update({ where: { tokenHash }, data: { lastSeenAt: new Date(now) } });
      }
      return session.user;
    },

    async revoke(token) {
      await prisma.session.deleteMany({ where: { tokenHash: sha256Hex(token) } });
    },
  };
}

export interface SessionCookie {
  name: string;
  options: CookieOptions;
}

export function sessionCookie(secure: boolean, ttlMs: number): SessionCookie {
  return {
    name: secure ? '__Host-wired_session' : 'wired_session',
    options: { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: ttlMs },
  };
}

export function loadSession(store: SessionStore, cookie: SessionCookie): RequestHandler {
  return async (req, _res, next) => {
    const token: unknown = req.cookies?.[cookie.name];
    req.user = typeof token === 'string' && token.length > 0 ? await store.resolve(token) : null;
    next();
  };
}

export const requireUser: RequestHandler = (req, _res, next) => {
  next(req.user ? undefined : new HttpError(401, 'unauthenticated'));
};

export function currentUser(req: Request): SessionUser {
  if (!req.user) throw new HttpError(401, 'unauthenticated');
  return req.user;
}
