/**
 * @openapi
 * components:
 *   schemas:
 *     Opportunity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         score:
 *           type: number
 *         phase:
 *           type: string
 *           enum: [EARLY, EXPANDING, MATURE, DECLINING]
 */

/**
 * @openapi
 * /api/v1/opportunities:
 *   get:
 *     summary: 获取机会列表
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *       - in: query
 *         name: gapType
 *         schema:
 *           type: string
 *       - in: query
 *         name: phase
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [score, createdAt, growth]
 *           default: score
 *     responses:
 *       200:
 *         description: 机会列表
 *   get:
 *     summary: 获取机会详情
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 机会详情
 */

import { Router } from 'express';
import { OpportunityController } from '../controllers/opportunities';

export const opportunitiesRouter = Router();

const controller = new OpportunityController();

opportunitiesRouter.get('/', controller.list);
opportunitiesRouter.get('/:id', controller.getById);
