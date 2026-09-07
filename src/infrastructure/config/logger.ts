import type { LoggerOptions } from 'pino';
import { env } from './env.js';

export function buildLoggerOptions(): LoggerOptions {
  const level = env.LOG_LEVEL;
  const isProduction = env.NODE_ENV === 'production';

  if (isProduction) {
    return { level };
  }

  return {
    level,
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: true,
      },
    },
  };
}
