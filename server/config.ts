import { existsSync } from 'node:fs';
import { z } from 'zod';

const secretKey = z
  .string()
  .refine((value) => Buffer.from(value, 'base64').length === 32, {
    message: 'must be 32 random bytes encoded as base64',
  })
  .transform((value) => Buffer.from(value, 'base64'));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_ORIGIN: z.url().transform((value) => new URL(value).origin),
  DATABASE_URL: z.string().regex(/^(mysql|mariadb):\/\//),
  TRUST_PROXY: z.coerce.number().int().nonnegative().default(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  DATA_ENCRYPTION_KEY: secretKey,
  OAUTH_STATE_KEY: secretKey,
  HABBODAN_OAUTH_ISSUER: z.url().transform((value) => new URL(value).origin),
  HABBODAN_OAUTH_CLIENT_ID: z.string().min(1),
  HABBODAN_OAUTH_CLIENT_SECRET: z.string().min(32),
});

export interface Config {
  env: 'development' | 'test' | 'production';
  port: number;
  appOrigin: string;
  databaseUrl: string;
  trustProxy: number;
  logLevel: string;
  secureCookies: boolean;
  sessionTtlMs: number;
  dataEncryptionKey: Buffer;
  oauthStateKey: Buffer;
  oauth: {
    clientId: string;
    clientSecret: string;
    authorizeUrl: string;
    tokenUrl: string;
    userinfoUrl: string;
    redirectUri: string;
  };
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues.map(
      (issue) => `  ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid environment:\n${problems.join('\n')}`);
  }

  const env = parsed.data;
  const issuer = env.HABBODAN_OAUTH_ISSUER;

  return {
    env: env.NODE_ENV,
    port: env.PORT,
    appOrigin: env.APP_ORIGIN,
    databaseUrl: env.DATABASE_URL,
    trustProxy: env.TRUST_PROXY,
    logLevel: env.LOG_LEVEL,
    secureCookies: env.APP_ORIGIN.startsWith('https://'),
    sessionTtlMs: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    dataEncryptionKey: env.DATA_ENCRYPTION_KEY,
    oauthStateKey: env.OAUTH_STATE_KEY,
    oauth: {
      clientId: env.HABBODAN_OAUTH_CLIENT_ID,
      clientSecret: env.HABBODAN_OAUTH_CLIENT_SECRET,
      authorizeUrl: `${issuer}/oauth/authorize`,
      tokenUrl: `${issuer}/api/oauth/token`,
      userinfoUrl: `${issuer}/api/oauth/userinfo`,
      redirectUri: `${env.APP_ORIGIN}/auth/callback`,
    },
  };
}

export function loadEnvFile(path = '.env'): void {
  if (existsSync(path)) process.loadEnvFile(path);
}
