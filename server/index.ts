import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { pino } from 'pino';
import { createApp } from './app.js';
import { loadConfig, loadEnvFile } from './config.js';

loadEnvFile();

const config = loadConfig();
const logger = pino({
  level: config.logLevel,
  ...(config.env === 'development' && { transport: { target: 'pino-pretty' } }),
});
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(config.databaseUrl) });

const clientDir =
  config.env === 'production'
    ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client')
    : undefined;

const app = createApp({ config, prisma, logger, clientDir });
const server = app.listen(config.port, () => {
  logger.info(`Listening on port ${config.port}`);
});

const cleanupTimer = setInterval(
  () => {
    prisma.session
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .catch((err: unknown) => logger.warn({ err }, 'Session cleanup failed'));
  },
  60 * 60 * 1000,
);
cleanupTimer.unref();

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
