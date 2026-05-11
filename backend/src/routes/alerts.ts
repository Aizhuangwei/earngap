import { Router } from 'express';
import { AlertsController } from '../controllers/alerts';

export const alertsRouter = Router();
const controller = new AlertsController();

alertsRouter.get('/', controller.list);
alertsRouter.patch('/:id/read', controller.markAsRead);
