import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import missionsRouter from '../api/missions';

vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'user-1' };
    req.supabase = {
      from: vi.fn((table) => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: (cb: any) => {
            // Emulate zero missions
            cb({ data: [], error: null });
          }
        }
      })
    };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/v1/workspaces/:workspaceId/missions', missionsRouter);

describe('GET /missions', () => {
  it('returns 200 for zero missions', async () => {
    const res = await request(app).get('/api/v1/workspaces/ws-1/missions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
