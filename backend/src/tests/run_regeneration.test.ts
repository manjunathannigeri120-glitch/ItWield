import { describe, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import missionsRouter from '../api/missions';
import { getServiceSupabase } from '../db/supabaseClient';

vi.mock('../middleware/auth', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        req.user = { id: '3b4e807f-5dda-45b5-a5b7-fe7573bda0cb' };
        req.supabase = getServiceSupabase();
        next();
    }
}));

const app = express();
app.use(express.json());
app.use('/api/v1/workspaces/:workspaceId/missions', missionsRouter);

describe('Regenerate Production Plan', () => {
    it('executes regeneration endpoint on production database', async () => {
        const workspaceId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3';
        const missionId = '1ba84012-52f7-460b-b672-65feb3ca1697';
        
        console.log(`Triggering regeneration for mission ${missionId}...`);
        
        const res = await request(app)
            .post(`/api/v1/workspaces/${workspaceId}/missions/${missionId}/plan/regenerate`);
            
        console.log('HTTP Status:', res.status);
        console.log('Response Body:', JSON.stringify(res.body, null, 2));
    }, 30000); // 30s timeout
});
