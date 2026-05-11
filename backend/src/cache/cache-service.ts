// Redis 缓存服务
import { redisClient } from './redis';

const DEFAULT_TTL = 300; // 5分钟
const STATS_TTL = 60;    // 1分钟（数据频繁变化）
const SCAN_TTL = 600;    // 10分钟

export class CacheService {
  // 通用缓存
  static async get<T>(key: string): Promise<T | null> {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
    await redisClient.setex(key, ttl, JSON.stringify(value));
  }

  static async del(key: string): Promise<void> {
    await redisClient.del(key);
  }

  static async delPattern(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  }

  // 机会缓存
  static async getOpportunities(page: number, limit: number): Promise<any> {
    const key = `opps:list:${page}:${limit}`;
    return this.get(key);
  }

  static async setOpportunities(page: number, limit: number, data: any): Promise<void> {
    const key = `opps:list:${page}:${limit}`;
    await this.set(key, data, DEFAULT_TTL);
  }

  static async clearOppCache(): Promise<void> {
    await this.delPattern('opps:*');
  }

  // 统计缓存
  static async getStats(): Promise<any> {
    return this.get('stats:dashboard');
  }

  static async setStats(data: any): Promise<void> {
    await this.set('stats:dashboard', data, STATS_TTL);
  }

  // 高分提醒队列（Redis List）
  static async pushAlert(alert: any): Promise<void> {
    await redisClient.lpush('alerts:queue', JSON.stringify(alert));
    await redisClient.ltrim('alerts:queue', 0, 99); // 最多保留100条
  }

  static async popAlerts(count: number = 10): Promise<any[]> {
    const items = await redisClient.lrange('alerts:queue', 0, count - 1);
    if (items.length > 0) {
      await redisClient.ltrim('alerts:queue', count, -1);
    }
    return items.map(item => JSON.parse(item));
  }

  // WebSocket 推送缓存（去重）
  static async wasPushed(eventId: string): Promise<boolean> {
    const exists = await redisClient.exists(`pushed:${eventId}`);
    return exists === 1;
  }

  static async markPushed(eventId: string, ttl: number = 3600): Promise<void> {
    await redisClient.setex(`pushed:${eventId}`, ttl, '1');
  }
}
