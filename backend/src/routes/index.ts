// API 路由汇总 - /api/v1
import { Router } from 'express';
import { opportunitiesRouter } from '../routes/opportunities';
import { statsRouter } from '../routes/stats';
import { alertsRouter } from '../routes/alerts';
import { scanRouter } from '../routes/scan';
import { featureFlags } from '../feature-flags';

export const apiRouter = Router();

apiRouter.use('/opportunities', opportunitiesRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/alerts', alertsRouter);
apiRouter.use('/scan', scanRouter);

// Feature flags endpoint
apiRouter.get('/features', (_req, res) => {
  res.json({
    success: true,
    data: featureFlags.getAll(),
    timestamp: new Date().toISOString(),
  });
});
