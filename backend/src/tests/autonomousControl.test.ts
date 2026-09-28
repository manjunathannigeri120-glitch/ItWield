import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => { req.user = { id: 'u-1' }; next(); }
}));

import goalsRouter from '../api/goals';

// Mock Supabase
const mockSupabase = {
  from: vi.fn((table) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'g-1', objective: 'Test', operating_status: 'ACTIVE' } }),
      then: vi.fn().mockImplementation((cb) => {
         if (table === 'company_memory') return cb({ data: [] });
         return cb({ data: [{ id: 'g-1', objective: 'Test', operating_status: 'ACTIVE' }] });
      })
    };
    return chain;
  })
};

const app = express();
app.use(express.json());
app.use((req: any, res: any, next: any) => {
  req.supabase = mockSupabase;
  next();
});
app.use('/api/v1/workspaces/:workspaceId/goals', goalsRouter);

vi.mock('../services/BusinessGoalInterpreter', () => ({
  BusinessGoalInterpreter: {
    interpretGoal: vi.fn().mockResolvedValue({
      intent_type: 'CONTROL',
      control_action: 'PAUSE',
      objective: 'Pause customer acquisition',
      scope: 'OWN_COMPANY'
    }),
    createGoal: vi.fn().mockResolvedValue({ id: 'g-1' })
  }
}));

describe('V3.12 Autonomous Control Commands', () => {
  it('handles PAUSE command natively', async () => {
    const res = await request(app).post('/api/v1/workspaces/ws-1/goals').send({ input: 'Pause customer acquisition' });
    expect(res.status).toBe(200);
    expect(res.body.is_direct_response).toBe(true);
    expect(res.body.answer).toContain('paused');
  });
});
