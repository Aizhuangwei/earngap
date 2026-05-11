// BullMQ Dead Letter Queue Configuration
import { Queue } from 'bullmq';
import { getRedisClient } from '../cache/health';
import { logger } from '../logger';

// 队列重试配置
export const DEFAULT_RETRY_CONFIG = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000, // 5s, 10s, 20s
  },
  removeOnComplete: 10,
  removeOnFail: 100,
};

// Dead Letter Queues
export const failedScanQueue = new Queue('failed-scan', {
  connection: getRedisClient(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

export const failedAlertQueue = new Queue('failed-alert', {
  connection: getRedisClient(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

// 处理失败任务 → 移入DLQ
export async function handleFailedJob(
  queueName: string,
  jobId: string,
  error: Error,
  attempts: number
): Promise<void> {
  logger.error({
    msg: `Job failed after ${attempts} attempts`,
    queue: queueName,
    jobId,
    error: error.message,
  });

  // 超过重试次数，移入DLQ
  if (attempts >= 3) {
    const dlq = queueName === 'scan' ? failedScanQueue : failedAlertQueue;
    await dlq.add(`failed:${jobId}`, {
      originalQueue: queueName,
      originalJobId: jobId,
      error: error.message,
      failedAt: new Date().toISOString(),
    });

    logger.warn({
      msg: 'Job moved to DLQ',
      dlq: dlq.name,
      originalQueue: queueName,
      jobId,
    });
  }
}
