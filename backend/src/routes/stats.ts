import { Router } from 'express';
import { StatsController } from '../controllers/stats';

export const statsRouter = Router();
const controller = new StatsController();

statsRouter.get('/', controller.getDashboardStats);
