// Redis Health Check + Retry + Graceful Shutdown
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://:earngap_redis@localhost:6379';

let redisClient: Redis;

export function createRedisClient(): Redis {
  redisClient = new Redis(REDIS_URL, {
    // Retry strategy: exponential backoff, max 30s
    retryStrategy(times) {
      if (times > 10) {
        console.error('[Redis] Max retries reached');
        return null; // 停止重试
      }
      const delay = Math.min(Math.pow(2, times) * 200, 30000);
      console.warn(`[Redis] Reconnecting (attempt ${times}) in ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,

    // Health check
    keepAlive: 30000,       // 30s keepalive
    connectTimeout: 10000,  // 10s connect timeout
    disconnectTimeout: 5000,
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected');
  });

  redisClient.on('ready', () => {
    console.log('[Redis] Ready');
  });

  redisClient.on('close', () => {
    console.warn('[Redis] Connection closed');
  });

  redisClient.on('reconnecting', (delay) => {
    console.warn(`[Redis] Reconnecting in ${delay}ms`);
  });

  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
}

// Health check
export async function checkRedisHealth(): Promise<{ status: string; latency: number }> {
  const start = Date.now();
  try {
    await redisClient.ping();
    return { status: 'connected', latency: Date.now() - start };
  } catch (error) {
    return { status: 'disconnected', latency: -1 };
  }
}

// Graceful shutdown
export async function shutdownRedis(): Promise<void> {
  if (redisClient) {
    console.log('[Redis] Shutting down...');
    await redisClient.quit();
    console.log('[Redis] Disconnected');
  }
}
