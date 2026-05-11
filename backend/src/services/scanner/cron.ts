import cron from 'node-cron';
import { enqueueFullScan } from '../queue';

export function initializeCron() {
  // 每日 09:00 全量扫描（北京时间）
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Starting daily full scan...');
    try {
      await enqueueFullScan();
      console.log('[Cron] Daily scan queued');
    } catch (error) {
      console.error('[Cron] Daily scan failed:', error);
    }
  }, {
    timezone: 'Asia/Shanghai',
  });

  console.log('[Cron] Schedules:');
  console.log('  - Daily full scan: 09:00 CST');
}
