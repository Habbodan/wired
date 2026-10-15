import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import type { Config } from './config.js';
import { createSealer } from './lib/crypto.js';
import { errorHandler, notFound } from './http/errors.js';
import { noStore, sameOriginGuard, securityHeaders } from './http/security.js';
import { createOAuthClient, type OAuthClient } from './auth/oauth.js';
import { authRouter } from './auth/routes.js';
import { createSessionStore, loadSession, requireUser, sessionCookie } from './auth/sessions.js';
import { createWorkspaceService } from './workspaces/service.js';
import { workspacesRouter } from './workspaces/routes.js';
import { serveClient } from './static.js';

export interface AppDeps {
  config: Config;
  prisma: PrismaClient;
  logger: Logger;
  oauth?: OAuthClient;
  clientDir?: string;
}

export function createApp({ config, prisma, logger, oauth, clientDir }: AppDeps): Express {
  const app = express();
  const sessions = createSessionStore(prisma, config.sessionTtlMs);
  const cookie = sessionCookie(config.secureCookies, config.sessionTtlMs);

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(
    pinoHttp({
      logger,
      redact: ['req.headers.cookie', 'res.headers["set-cookie"]'],
      serializers: {
        req(req: { url: string }) {
          return req.url.startsWith('/auth') ? { ...req, url: req.url.split('?')[0] } : req;
        },
      },
    }),
  );
  app.use(securityHeaders(config.env === 'production'));
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));

  const limiter = (limit: number) =>
    rateLimit({ windowMs: 60_000, limit, standardHeaders: 'draft-8', legacyHeaders: false });

  app.use(
    '/auth',
    limiter(30),
    noStore,
    sameOriginGuard(config.appOrigin),
    authRouter({
      prisma,
      logger,
      oauth: oauth ?? createOAuthClient(config.oauth),
      sessions,
      sessionCookie: cookie,
      stateSealer: createSealer(config.oauthStateKey),
      secureCookies: config.secureCookies,
    }),
  );

  const api = express.Router();
  api.use(limiter(240), noStore, sameOriginGuard(config.appOrigin), loadSession(sessions, cookie));
  api.get('/me', (req, res) => {
    res.json({ user: req.user ?? null });
  });
  api.use(
    '/workspaces',
    requireUser,
    workspacesRouter(createWorkspaceService(prisma, createSealer(config.dataEncryptionKey))),
  );
  api.use(notFound);
  app.use('/api', api);

  if (clientDir) app.use(serveClient(clientDir));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
