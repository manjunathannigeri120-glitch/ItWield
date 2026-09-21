import { Router } from 'express';
import agentRoutes from './agents';
import workspaceRoutes from './workspaces';
import conversationRoutes from './conversations';
import knowledgeRoutes from './knowledge';

import workflowsRouter from './workflows';
import webhooksRouter from './webhooks';
import connectionsRouter from './connections';
import { tasksRouter } from './tasks';
import { ceoRouter } from './ceo';
import { schedulerRouter } from './scheduler';

const router = Router();

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
