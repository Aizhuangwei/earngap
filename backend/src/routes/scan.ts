import { Router } from 'express';
import { ScanController } from '../controllers/scan';

export const scanRouter = Router();
const controller = new ScanController();

scanRouter.post('/trigger', controller.triggerScan);
scanRouter.get('/logs', controller.getLogs);
