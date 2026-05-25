import pino from 'pino';

const isDev = process.env['NODE_ENV'] !== 'production';

export const logger = pino(
  {
    level: process.env['LOG_LEVEL'] ?? 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    // Redact any field that might accidentally carry secrets.
    redact: {
      paths: ['token', 'password', 'authorization', 'service_role_key'],
      censor: '[REDACTED]',
    },
  },
  // In dev, pass the resolved path so pino's worker thread can find pino-pretty
  // across the monorepo's hoisted node_modules.
  isDev
    ? pino.transport({ target: require.resolve('pino-pretty'), options: { colorize: true, translateTime: 'SYS:standard' } })
    : undefined,
);
