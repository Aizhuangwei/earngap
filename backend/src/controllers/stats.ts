import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../cache/cache-service';

const prisma = new PrismaClient();

export class StatsController {
  async getDashboardStats(req: Request, res: Response) {
    try {
      const cached = await CacheService.getStats();
      if (cached) return res.json(cached);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [
        totalOpps,
        highScoreOpps,
        todayNewOpps,
        avgScore,
        activeAlerts,
        recentScans,
      ] = await Promise.all([
        prisma.opportunity.count({ where: { isActive: true } }),
        prisma.opportunity.count({ where: { isActive: true, score: { gte: 70 } } }),
        prisma.opportunity.count({ where: { isActive: true, createdAt: { gte: todayStart } } }),
        prisma.opportunity.aggregate({ _avg: { score: true }, where: { isActive: true } }),
        prisma.alert.count({ where: { isRead: false } }),
        prisma.scanLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      ]);

      const result = {
        total: totalOpps,
        highScore: highScoreOpps,
        newToday: todayNewOpps,
        avgScore: Math.round((avgScore._avg.score || 0) * 10) / 10,
        alerts: activeAlerts,
        recentScans,
      };

      await CacheService.setStats(result);
      res.json(result);
    } catch (error) {
      console.error('[StatsController] error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
