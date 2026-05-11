// BullMQ 队列系统
import { Queue, Worker, QueueEvents } from 'bullmq';
import { redisClient } from '../cache/redis';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || 'earngap_redis',
};

// ==================== 队列定义 ====================

export const scanQueue = new Queue('scan', { connection });
export const alertQueue = new Queue('alert', { connection });
export const translateQueue = new Queue('translate', { connection });
export const seoQueue = new Queue('seo', { connection });

const queueEvents = new QueueEvents('scan', { connection });

// ==================== 任务类型 ====================

export enum JobType {
  FULL_SCAN = 'full-scan',
  QUICK_SCAN = 'quick-scan',
  SCORE_UPDATE = 'score-update',
  SEND_ALERT = 'send-alert',
  TRANSLATE = 'translate',
  GENERATE_SEO = 'generate-seo',
}

// ==================== 初始化 ====================

export async function initializeQueues() {
  // 扫描 Worker
  new Worker('scan', async (job) => {
    const { type } = job.data;
    console.log(`[Queue] Processing scan job: ${job.id}, type: ${type}`);

    switch (type) {
      case JobType.FULL_SCAN:
        // 全量扫描逻辑
        break;
      case JobType.QUICK_SCAN:
        // 快速扫描逻辑
        break;
      default:
        console.warn(`[Queue] Unknown job type: ${type}`);
    }
  }, { connection });

  // 提醒 Worker
  new Worker('alert', async (job) => {
    console.log(`[Queue] Processing alert: ${job.id}`);
    // 发送提醒到 Redis List，由 WebSocket 推送
  }, { connection });

  queueEvents.on('completed', ({ jobId, returnvalue }) => {
    console.log(`[Queue] Job ${jobId} completed:`, returnvalue);
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`[Queue] Job ${jobId} failed:`, failedReason);
  });

  console.log('[Queue] Workers initialized');
}

// ==================== 任务添加函数 ====================

export async function enqueueFullScan() {
  return scanQueue.add(JobType.FULL_SCAN, {
    type: JobType.FULL_SCAN,
    timestamp: new Date().toISOString(),
  }, {
    removeOnComplete: 10,
    removeOnFail: 100,
  });
}

export async function enqueueAlert(opportunityId: string, message: string) {
  return alertQueue.add(JobType.SEND_ALERT, {
    type: JobType.SEND_ALERT,
    opportunityId,
    message,
  }, {
    removeOnComplete: 10,
    removeOnFail: 100,
  });
}
