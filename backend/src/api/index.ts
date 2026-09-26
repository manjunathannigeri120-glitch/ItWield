import { Router } from 'express';
import agentRoutes from './agents';
import workspaceRoutes from './workspaces';
import missionsRoutes from './missions';
import conversationRoutes from './conversations';
import knowledgeRoutes from './knowledge';

import workflowsRouter from './workflows';
import webhooksRouter from './webhooks';
import connectionsRouter from './connections';
import { tasksRouter } from './tasks';
import { ceoRouter } from './ceo';
import { schedulerRouter } from './scheduler';
import memoryRoutes from './memory';
import commandCenterRoutes from './commandCenter';
import crmRoutes from './crm';
import goalsRouter from './goals';

const router = Router();

router.use('/workspaces/:workspaceId/missions', missionsRoutes);
router.use('/workspaces/:workspaceId/memory', memoryRoutes);
router.use('/workspaces/:workspaceId/command-center', commandCenterRoutes);
router.use('/workspaces/:workspaceId/crm', crmRoutes);
router.use('/workspaces/:workspaceId/goals', goalsRouter);
router.use('/workspaces', workspaceRoutes);
router.use('/agents', agentRoutes);
router.use('/conversations', conversationRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/workflows', workflowsRouter);
router.use('/webhooks', webhooksRouter);
router.use('/connections', connectionsRouter);
router.use('/tasks', tasksRouter);
router.use('/ceo', ceoRouter);
router.use('/scheduler', schedulerRouter);

export default router;
