import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import { randomToken, safeEqual, sha256Base64Url, type Sealer } from '../lib/crypto.js';
import type { OAuthClient } from './oauth.js';
import type { SessionCookie, SessionStore } from './sessions.js';
import {
  openTransaction,
  safeReturnTo,
  sealTransaction,
  transactionCookie,
} from './transaction.js';

interface AuthRouterDeps {
  prisma: PrismaClient;
  logger: Logger;
  oauth: OAuthClient;
  sessions: SessionStore;
  sessionCookie: SessionCookie;
  stateSealer: Sealer;
  secureCookies: boolean;
}

export function authRouter(deps: AuthRouterDeps): Router {
  const { prisma, logger, oauth, sessions, sessionCookie, stateSealer } = deps;
  const txCookie = transactionCookie(deps.secureCookies);
  const router = Router();

  router.get('/login', (req, res) => {
    const state = randomToken(32);
    const codeVerifier = randomToken(48);
    const returnTo = safeReturnTo(req.query.returnTo);

    res.cookie(
      txCookie.name,
      sealTransaction(stateSealer, { state, codeVerifier, returnTo }),
      txCookie.options,
    );
    res.redirect(
      302,
      oauth.authorizationUrl({ state, codeChallenge: sha256Base64Url(codeVerifier) }),
    );
  });

  router.get('/callback', async (req, res) => {
    const transaction = openTransaction(stateSealer, req.cookies?.[txCookie.name]);
    res.clearCookie(txCookie.name, { ...txCookie.options, maxAge: undefined });

    const { code, state, error } = req.query;
    const stateMatches =
      transaction !== null && typeof state === 'string' && safeEqual(state, transaction.state);

    if (!stateMatches || typeof code !== 'string' || error !== undefined) {
      res.redirect(302, '/?login=failed');
      return;
    }

    try {
      const profile = await oauth.exchangeCode({ code, codeVerifier: transaction.codeVerifier });
      const user = await prisma.user.upsert({
        where: { habbodanId: profile.habbodanId },
        update: { username: profile.username, hotel: profile.hotel },
        create: profile,
      });

      const previous: unknown = req.cookies?.[sessionCookie.name];
      if (typeof previous === 'string' && previous.length > 0) await sessions.revoke(previous);

      res.cookie(sessionCookie.name, await sessions.create(user.id), sessionCookie.options);
      res.redirect(302, transaction.returnTo);
    } catch (err) {
      logger.warn({ err }, 'OAuth callback failed');
      res.redirect(302, '/?login=failed');
    }
  });

  router.post('/logout', async (req, res) => {
    const token: unknown = req.cookies?.[sessionCookie.name];
    if (typeof token === 'string' && token.length > 0) await sessions.revoke(token);
    res.clearCookie(sessionCookie.name, { ...sessionCookie.options, maxAge: undefined });
    res.status(204).end();
  });

  return router;
}
