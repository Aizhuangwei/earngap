import { getRedisClient } from '../cache/health';
import { logger, queueLogger } from '../logger';

export interface QueueStatus {
  status: string;
  waiting?: number;
  active?: number;
  failed?: number;
  delayed?: number;
}

export async function getQueueStatus(): Promise<{ status: string; queues: Record<string, QueueStatus> }> {
  const redis = getRedisClient();
  const queues = ['scan', 'alert', 'translate', 'seo'];
  const result: Record<string, QueueStatus> = {};

  for (const name of queues) {
    try {
      const prefix = process.env.BULLMQ_PREFIX || 'earngap';
      const [waiting, active, failed, delayed] = await Promise.all([
        redis.llen(`${prefix}:${name}:wait`),
        redis.llen(`${prefix}:${name}:active`),
        redis.llen(`${prefix}:${name}:failed`),
        redis.llen(`${prefix}:${name}:delayed`),
      ]);

      result[name] = {
        status: active > 0 ? 'running' : 'idle',
        waiting,
        active,
        failed,
        delayed,
      };
    } catch (error) {
      result[name] = { status: 'error' };
      queueLogger.error({ msg: `Failed to get queue status`, queue: name, error });
    }
  }

  return { status: 'ok', queues: result };
}
