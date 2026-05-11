// Structured Logging with Pino
import pino from 'pino';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || '/var/log/earngap';

const transport = pino.transport({
  targets: [
    // Console (development)
    ...(process.env.NODE_ENV !== 'production'
      ? [{ target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }]
      : []),
    // Combined log (all levels)
    {
      target: 'pino/file',
      options: {
        destination: path.join(LOG_DIR, 'combined.log'),
        mkdir: true,
      },
      level: 'info',
    },
    // Error log
    {
      target: 'pino/file',
      options: {
        destination: path.join(LOG_DIR, 'error.log'),
        mkdir: true,
      },
      level: 'error',
    },
  ],
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
      err: pino.stdSerializers.err,
    },
  },
  transport,
);

// Specialized loggers
export const scanLogger = logger.child({ module: 'scanner' });
export const alertLogger = logger.child({ module: 'alert' });
export const queueLogger = logger.child({ module: 'queue' });
export const socketLogger = logger.child({ module: 'socket' });
