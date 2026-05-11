// EarnGap Backend - 入口文件（生产级）
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';

import { validateEnv } from './config/env';
import { createRedisClient, shutdownRedis } from './cache/health';
import { initializeSocket } from './socket';
import { initializeQueues } from './queue';
import { initializeCron } from './services/scanner/cron';
import { swaggerSpec } from './config/swagger';
import { apiRouter } from './routes';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { logger } from './logger';

// ==================== 环境验证（必须最先执行） ====================
const env = validateEnv();

const app = express();
const httpServer = createServer(app);
const PORT = env.PORT;

// ==================== 安全中间件 ====================
app.use(helmet({
  contentSecurityPolicy: false, // 由Next.js管理
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map(s => s.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// ==================== Rate Limiting ====================
// 通用API限流
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
app.use('/api/', apiLimiter);

// 扫描触发限流（更严格）
const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Scan trigger limited to 3/hour' } },
});
app.use('/api/v1/scan/trigger', scanLimiter);

// ==================== Swagger API文档 ====================
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== 路由 ====================
app.use('/health', healthRouter);
app.use('/api/v1', apiRouter);

// ==================== 错误处理 ====================
app.use(errorHandler);

// ==================== 初始化 ====================

async function bootstrap() {
  try {
    // Redis
    const redis = createRedisClient();
    await redis.ping();
    logger.info({ msg: 'Redis connected', url: env.REDIS_URL.replace(/\/\/.*@/, '//***@') });

    // Socket.IO
    initializeSocket(httpServer);
    logger.info('[Socket] Initialized');

    // BullMQ Queues
    await initializeQueues();
    logger.info('[Queue] BullMQ initialized');

    // Cron Jobs
    initializeCron();
    logger.info('[Cron] Scheduler started');

    // 启动
    httpServer.listen(PORT, () => {
      logger.info({
        msg: 'Server started',
        port: PORT,
        env: env.NODE_ENV,
        apiDocs: `http://localhost:${PORT}/api/docs`,
      });
    });
  } catch (error) {
    logger.fatal({ msg: 'Failed to bootstrap', error });
    process.exit(1);
  }
}

bootstrap();

// ==================== 优雅关闭 ====================
async function gracefulShutdown(signal: string) {
  logger.info({ msg: `Received ${signal}, shutting down...` });

  httpServer.close(() => {
    logger.info('[Server] HTTP server closed');
  });

  await shutdownRedis();
  logger.info('[Server] Goodbye');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, httpServer };
