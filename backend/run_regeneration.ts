import express from 'express';
import request from 'supertest';
import apiRoutes from './src/api/index';
import { getServiceSupabase } from './src/db/supabaseClient';

// We must override the middleware. Actually, in ts-node without vitest, jest.mock doesn't exist.
// Let's just override requireAuth on the imported module if possible, or build an express app that mounts the missions router directly.

import { missionsRouter } from './src/api/missions';

const app = express();
app.use(express.json());

// Inject custom auth middleware before mounting missionsRouter
app.use('/api/v1/workspaces/:workspaceId/missions', (req: any, res, next) => {
    req.user = { id: '3b4e807f-5dda-45b5-a5b7-fe7573bda0cb' };
    req.supabase = getServiceSupabase();
    next();
}, missionsRouter);

async function run() {
    const workspaceId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3';
    const missionId = '1ba84012-52f7-460b-b672-65feb3ca1697';
    
    console.log(`Triggering regeneration for mission ${missionId}...`);
    
    const res = await request(app)
        .post(`/api/v1/workspaces/${workspaceId}/missions/${missionId}/plan/regenerate`);
        
    console.log('HTTP Status:', res.status);
    console.log('Response Body:', JSON.stringify(res.body, null, 2));
}

run().catch(console.error);
