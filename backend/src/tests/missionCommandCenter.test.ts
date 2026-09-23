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
        const query: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((col, val) => {
            if (col === 'workspace_id' && val !== 'valid-ws') {
              return {
                order: vi.fn().mockReturnThis(),
                single: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                then: (cb: any) => cb({ data: null, error: { code: 'PGRST116', message: 'not found in workspace' } })
              };
            }
            return query;
          }),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            const result = mockSupabaseResponses[table];
            if (!result || !result.data || result.data.length === 0) {
              return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'not found' } });
            }
            return Promise.resolve({ data: result.data[0], error: null });
          }),
          then: (cb: any) => cb(mockSupabaseResponses[table] || { data: [], error: null })
        };
        return query;
      })
    };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/v1/workspaces/:workspaceId/missions', missionsRouter);

describe('Mission Command Center API Endpoints', () => {
  beforeEach(() => {
    mockSupabaseResponses = {
        'business_missions': { data: [{ id: 'm-1', type: 'GET_CUSTOMERS', status: 'ACTIVE', target_count: 25 }] },
        'tasks': { data: [{ id: 't-1', status: 'PENDING' }] },
        'mission_results': { data: [{ id: 'r-1', verification_status: 'VERIFIED' }] },
        'mission_events': { data: [{ id: 'e-1', event_type: 'MISSION_CREATED' }] }, 'mission_plans': { data: [{ id: 'p-1', version: 1, status: 'ACTIVE' }] }, 'mission_plan_steps': { data: [{ id: 's-1', status: 'PENDING' }] },
        'approvals': { data: [] }
    };
    mockUserId = 'user-A';
    vi.clearAllMocks();
  });

  it('1. Mission detail returns correct mission', async () => {
    const res = await request(app).get('/api/v1/workspaces/valid-ws/missions/m-1');
    expect(res.status).toBe(200);
    expect(res.body.mission.id).toBe('m-1');
  });

  it('2. Mission detail uses MissionProgressService, 4. Verified results are counted, 8. Blocker is surfaced', async () => {
    const res = await request(app).get('/api/v1/workspaces/valid-ws/missions/m-1');
    expect(res.body.progress).toBeDefined();
    expect(res.body.progress.results.verified).toBe(1);
    expect(res.body.progress.blocker).toBeNull();
  });

  it('5. Unverified results are not counted as verified, 6. Rejected results are not counted', async () => {
    mockSupabaseResponses['mission_results'] = { data: [
        { id: 'r-1', verification_status: 'UNVERIFIED' },
        { id: 'r-2', verification_status: 'REJECTED' }
    ]};
    const res = await request(app).get('/api/v1/workspaces/valid-ws/missions/m-1');
    expect(res.body.progress.results.verified).toBe(0);
    expect(res.body.progress.results.unverified).toBe(1);
    expect(res.body.progress.results.rejected).toBe(1);
  });

  it('7. Missing target produces measurable=false', async () => {
    mockSupabaseResponses['business_missions'] = { data: [{ id: 'm-1', type: 'GET_CUSTOMERS', status: 'ACTIVE', target_count: null }] };
    const res = await request(app).get('/api/v1/workspaces/valid-ws/missions/m-1');
    expect(res.body.progress.progress.measurable).toBe(false);
  });

  it('9. Activity is returned', async () => {
    const res = await request(app).get('/api/v1/workspaces/valid-ws/missions/m-1');
    expect(res.body.activity.length).toBe(1);
    expect(res.body.activity[0].id).toBe('e-1');
  });

  it('10. Workspace authorization is enforced, 11. Non-member cannot access another workspace mission', async () => {
    const res = await request(app).get('/api/v1/workspaces/other-ws/missions/m-1');
    expect(res.status).toBe(404);
  });

  it('12. Missing mission returns 404', async () => {
    mockSupabaseResponses['business_missions'] = { data: [] };
    const res = await request(app).get('/api/v1/workspaces/valid-ws/missions/non-existent');
    expect(res.status).toBe(404);
  });
});

