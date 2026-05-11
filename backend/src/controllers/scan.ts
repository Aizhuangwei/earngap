import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { enqueueFullScan } from '../queue';

const prisma = new PrismaClient();

export class ScanController {
  async triggerScan(req: Request, res: Response) {
    try {
      const scanLog = await prisma.scanLog.create({
        data: { status: 'running' },
      });

      await enqueueFullScan();

      res.json({
        success: true,
        scanId: scanLog.id,
        message: 'Scan queued',
      });
    } catch (error) {
      console.error('[ScanController] trigger error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getLogs(req: Request, res: Response) {
    try {
      const logs = await prisma.scanLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      res.json(logs);
    } catch (error) {
      console.error('[ScanController] getLogs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
