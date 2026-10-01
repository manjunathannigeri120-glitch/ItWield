import { Router } from 'express';
import authRoutes from './auth';
import paymentRoutes from './payments';
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
import cooRouter from './coo';

import companyRouter from './company';
import chatRouter from './chat';
import controlRouter from './control';
import discoveryRouter from './discovery';
import workforceRouter from './workforce';
import ctoRouter from './cto';

const router = Router();
router.get('/health', (req, res) => res.json({ status: 'ok', version: '3.19.0' }));
router.use('/workspaces/:workspaceId/company', companyRouter);

router.use('/workspaces/:workspaceId/missions', missionsRoutes);
router.use('/workspaces/:workspaceId/memory', memoryRoutes);
router.use('/workspaces/:workspaceId/command-center', commandCenterRoutes);
router.use('/workspaces/:workspaceId/crm', crmRoutes);
router.use('/workspaces/:workspaceId/goals', goalsRouter);
router.use('/workspaces/:workspaceId/workforce', workforceRouter);
router.use('/cto', ctoRouter);
router.use('/workspaces/:workspaceId', cooRouter);
router.use('/workspaces/:workspaceId/control', controlRouter);
router.use('/workspaces/:workspaceId/discovery', discoveryRouter);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:workspaceId/chat', chatRouter);
router.use('/agents', agentRoutes);
router.use('/conversations', conversationRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/workflows', workflowsRouter);
router.use('/webhooks', webhooksRouter);
router.use('/connections', connectionsRouter);
router.use('/tasks', tasksRouter);
router.use('/ceo', ceoRouter);
router.use('/scheduler', schedulerRouter);
router.use('/auth', authRoutes);
router.use('/payments', paymentRoutes);

export default router;
