import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AlertsController {
  async list(req: Request, res: Response) {
    try {
      const alerts = await prisma.alert.findMany({
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          opportunity: {
            select: { id: true, title: true, score: true },
          },
        },
      });

      res.json(alerts);
    } catch (error) {
      console.error('[AlertsController] list error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.alert.update({
        where: { id },
        data: { isRead: true },
      });
      res.json({ success: true });
    } catch (error) {
      console.error('[AlertsController] markAsRead error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
