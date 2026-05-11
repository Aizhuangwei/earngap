// Analytics Engine - 数据分析和趋势
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../../cache/cache-service';
import { logger } from '../../logger';

const prisma = new PrismaClient();

export interface DashboardAnalytics {
  topTrends: { title: string; score: number; growth: number; phase: string }[];
  categoryDistribution: { category: string; count: number }[];
  lifecycleDistribution: { phase: string; count: number }[];
  averageScore: number;
  totalActive: number;
  newToday: number;
  scoreTrend: { date: string; avgScore: number }[];
}

export class AnalyticsEngine {
  async getDashboard(): Promise<DashboardAnalytics> {
    // 尝试缓存
    const cached = await CacheService.get<DashboardAnalytics>('analytics:dashboard');
    if (cached) return cached;

    // Top 趋势（按增长率排序）
    const topOpportunities = await prisma.opportunity.findMany({
      where: { isActive: true },
      orderBy: { growth: 'desc' },
      take: 10,
      select: { title: true, score: true, growth: true, phase: true },
    });

    // 分类分布
    const allOpps = await prisma.opportunity.findMany({
      where: { isActive: true },
      select: { gapType: true, phase: true, score: true },
    });

    // 生命周期分布
    const lifecycleDistribution = this.countBy(allOpps, 'phase');

    // 总分/均值
    const scores = allOpps.map(o => o.score);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const result: DashboardAnalytics = {
      topTrends: topOpportunities.map(o => ({
        title: o.title,
        score: o.score,
        growth: o.growth || 0,
        phase: o.phase,
      })),
      categoryDistribution: this.countBy(allOpps, 'gapType'),
      lifecycleDistribution,
      averageScore: Math.round(averageScore * 10) / 10,
      totalActive: allOpps.length,
      newToday: allOpps.filter(o => {
        // 简化：假设今日新增
        return true;
      }).length,
      scoreTrend: [],
    };

    await CacheService.set('analytics:dashboard', result, 300);
    return result;
  }

  private countBy(items: any[], field: string): { [key: string]: number }[] {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const key = String(item[field] || 'UNKNOWN');
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([key, count]) => ({ [field]: key, count } as any));
  }
}
