import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../cache/cache-service';
import { sendSuccess, sendError, ErrorCodes } from '../middleware/response';
import { logger } from '../logger';

const prisma = new PrismaClient();

export class OpportunityController {
  // 机会列表（分页+筛选）
  async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const minScore = parseFloat(req.query.minScore as string) || 0;
      const gapType = req.query.gapType as string;
      const phase = req.query.phase as string;
      const sortBy = (req.query.sortBy as string) || 'score';
      const skip = (page - 1) * limit;

      // 尝试缓存
      const cacheKey = `opps:${page}:${limit}:${minScore}:${gapType || 'all'}:${phase || 'all'}:${sortBy}`;
      const cached = await CacheService.get(cacheKey);
      if (cached) return sendSuccess(res, cached);

      // 构建查询
      const where: any = { isActive: true };
      if (minScore > 0) where.score = { gte: minScore };
      if (gapType) where.gapType = gapType;
      if (phase) where.phase = phase;

      const orderBy: any = {};
      orderBy[sortBy] = 'desc';

      const [opportunities, total] = await Promise.all([
        prisma.opportunity.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            dimensions: true,
            sources: { include: { source: true } },
            _count: { select: { alerts: true } },
          },
        }),
        prisma.opportunity.count({ where }),
      ]);

      const result = {
        opportunities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      await CacheService.set(cacheKey, result, 300);
      sendSuccess(res, result);
    } catch (error) {
      logger.error({ msg: 'list error', error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Internal server error');
    }
  }

  // 机会详情
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const opportunity = await prisma.opportunity.findUnique({
        where: { id },
        include: {
          dimensions: true,
          steps: { orderBy: { stepOrder: 'asc' } },
          sources: { include: { source: true } },
          scoreHistory: { orderBy: { createdAt: 'desc' }, take: 30 },
        },
      });

      if (!opportunity) {
        return sendError(res, ErrorCodes.NOT_FOUND, 'Opportunity not found', 404);
      }

      sendSuccess(res, opportunity);
    } catch (error) {
      logger.error({ msg: 'getById error', error });
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Internal server error');
    }
  }
}
