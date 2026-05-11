// Health Check API
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkRedisHealth } from '../cache/health';
import { getQueueStatus } from '../queue';
import { sendSuccess, sendError } from '../middleware/response';
import { logger } from '../logger';

const prisma = new PrismaClient();
export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const checks: any = {};

  // PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = { status: 'connected' };
  } catch (error) {
    checks.postgres = { status: 'disconnected', error: (error as Error).message };
  }

  // Redis
  checks.redis = await checkRedisHealth();

  // Queue
  try {
    const queueStatus = await getQueueStatus();
    checks.queue = queueStatus;
  } catch (error) {
    checks.queue = { status: 'error', error: (error as Error).message };
  }

  // Socket (reported by socket module)
  checks.socket = { status: 'running' };

  // Overall status
  const allHealthy = Object.values(checks).every(
    (c: any) => c.status === 'connected' || c.status === 'running' || c.status === 'ready'
  );

  if (allHealthy) {
    sendSuccess(res, { status: 'ok', checks });
  } else {
    sendError(res, 'SERVICE_DEGRADED', 'Some services are unavailable', 503, checks);
  }
});

// Detailed health (admin only later)
healthRouter.get('/detailed', async (_req: Request, res: Response) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  sendSuccess(res, {
    status: 'ok',
    uptime: Math.floor(uptime),
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
    },
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  });
});
