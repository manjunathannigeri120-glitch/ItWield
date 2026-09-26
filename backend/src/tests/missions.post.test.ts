import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import missionsRouter from '../api/missions';

let mockSupabaseResponses: any = {};
let mockUserId = 'user-1';

vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: mockUserId };
    req.supabase = {
      from: vi.fn((table: string) => {
        return {
          insert: vi.fn((data) => {
            if (table === 'business_missions' && data.workspace_id === 'other-ws') {
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockImplementation(() => {
                  return Promise.resolve({ data: null, error: { message: 'new row violates row-level security policy for table "business_missions"' } });
                })
              };
            }
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { id: 'm-1', ...data }, error: null })
            };
          }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          then: (cb: any) => cb({ data: [], error: null })
        };
      })
    };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/v1/workspaces/:workspaceId/missions', missionsRouter);

describe('POST /missions (Create Mission)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates GET_CUSTOMERS mission successfully', async () => {
    const res = await request(app).post('/api/v1/workspaces/valid-ws/missions').send({
      type: 'GET_CUSTOMERS',
      title: 'Get 10 Customers',
      objective: 'Do it fast',
    });
    
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('m-1');
  });

  it('rejects invalid mission type with 400', async () => {
    const res = await request(app).post('/api/v1/workspaces/valid-ws/missions').send({
      type: 'INVALID_TYPE',
      title: 'Get 10 Customers',
      objective: 'Do it fast',
    });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid or missing mission type');
  });

  it('rejects missing required fields (title)', async () => {
    const res = await request(app).post('/api/v1/workspaces/valid-ws/missions').send({
      type: 'GET_CUSTOMERS',
      objective: 'Do it fast',
    });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Mission title is required');
  });

  it('rejects missing required fields (objective)', async () => {
    const res = await request(app).post('/api/v1/workspaces/valid-ws/missions').send({
      type: 'GET_CUSTOMERS',
      title: 'Title',
    });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Mission objective is required');
  });

  it('rejects unauthorized workspace access (simulated RLS violation)', async () => {
    const res = await request(app).post('/api/v1/workspaces/other-ws/missions').send({
      type: 'GET_CUSTOMERS',
      title: 'Get 10 Customers',
      objective: 'Do it fast',
    });
    
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Unauthorized to create missions in this workspace');
  });
});
