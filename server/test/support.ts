import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { pino } from 'pino';
import { createApp } from '../app.js';
import { loadConfig } from '../config.js';
import type { OAuthClient } from '../auth/oauth.js';

export const APP_ORIGIN = 'https://wired.test';

export function testConfig() {
  return loadConfig({
    NODE_ENV: 'test',
    APP_ORIGIN,
    DATABASE_URL: 'mysql://wired:wired@localhost:3306/wired',
    DATA_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
    OAUTH_STATE_KEY: randomBytes(32).toString('base64'),
    HABBODAN_OAUTH_ISSUER: 'https://id.test',
    HABBODAN_OAUTH_CLIENT_ID: 'wired',
    HABBODAN_OAUTH_CLIENT_SECRET: 'x'.repeat(40),
  });
}

export function testApp(overrides: { prisma?: Partial<PrismaClient>; oauth?: OAuthClient } = {}) {
  return createApp({
    config: testConfig(),
    prisma: (overrides.prisma ?? {}) as PrismaClient,
    logger: pino({ level: 'silent' }),
    ...(overrides.oauth && { oauth: overrides.oauth }),
  });
}
