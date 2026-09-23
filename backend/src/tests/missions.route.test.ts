import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import missionsRouter from '../api/missions';

let mockSupabaseResponses: any = {};
let mockUserId = 'user-A';

vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: mockUserId };
    req.supabase = {
      from: vi.fn((table: string) => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((col, val) => {
            // Emulate workspace isolation
            if (col === 'workspace_id' && val !== 'valid-ws') {
              return {
                order: vi.fn().mockReturnThis(),
                single: vi.fn().mockReturnThis(),
                then: (cb: any) => cb({ data: [], error: null })
              };
            }
            return {
              order: vi.fn().mockReturnThis(),
              single: vi.fn().mockReturnThis(),
              then: (cb: any) => cb(mockSupabaseResponses[table] || { data: [], error: null })
            };
          }),
          order: vi.fn().mockReturnThis(),
          then: (cb: any) => cb(mockSupabaseResponses[table] || { data: [], error: null })
        };
      })
    };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/v1/workspaces/:workspaceId/missions', missionsRouter);

describe('Missions API Endpoints', () => {
  beforeEach(() => {
    mockSupabaseResponses = {};
    mockUserId = 'user-A';
    vi.clearAllMocks();
  });

  it('zero business missions => GET /missions returns HTTP 200 with empty array', async () => {
    // Return empty data (simulating zero rows)
    mockSupabaseResponses['business_missions'] = { data: [], error: null };
    
    const res = await request(app).get('/api/v1/workspaces/valid-ws/missions');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('workspace with one active mission => GET /missions returns HTTP 200 with data', async () => {
    mockSupabaseResponses['business_missions'] = { 
      data: [{ id: 'm-1', type: 'GET_CUSTOMERS', status: 'ACTIVE' }], 
      error: null 
    };
    
    const res = await request(app).get('/api/v1/workspaces/valid-ws/missions');
    
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe('m-1');
  });

  it('workspace isolation: user A must not retrieve user B missions (simulated via RLS)', async () => {
    // If user A accesses workspace 'other-ws', the RLS (mocked in eq) will return []
    mockSupabaseResponses['business_missions'] = { 
      data: [{ id: 'm-1', type: 'GET_CUSTOMERS', status: 'ACTIVE' }], 
      error: null 
    };
    
    const res = await request(app).get('/api/v1/workspaces/other-ws/missions');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
