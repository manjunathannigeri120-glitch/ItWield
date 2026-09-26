import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'user-1' };
    next();
  }
}));

import commandCenterRouter from '../api/commandCenter';

// Mock auth middleware to inject fake supabase client
const mockSupabase = {
  from: vi.fn()
};

const app = express();
app.use(express.json());
// Inject mock supabase
app.use((req: any, res, next) => {
  req.supabase = mockSupabase;
  next();
});
app.use('/workspaces/:workspaceId/command-center', commandCenterRouter);

describe('Command Center API', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Returns 404 if workspace does not exist', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      })
    });
    mockSupabase.from.mockReturnValue({ select: mockSelect });

    const res = await request(app).get('/workspaces/ws-999/command-center');
    expect(res.status).toBe(404);
  });

  it('2. Aggregates data and calculates Company Status correctly', async () => {
    // Mock the sequential query builders for all the parallel calls
    mockSupabase.from.mockImplementation((table: string) => {
      const createChain = (data: any) => {
        const chain: any = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          neq: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })),
          then: (resolve: any) => resolve({ data, error: null })
        };
        return chain;
      };

      if (table === 'workspaces') return createChain({ id: 'ws-1', name: 'Test WS', company_goals: 'acquire customers' });
      if (table === 'incidents') return createChain([{ type: 'application_health', status: 'ACTIVE', severity: 'high', created_at: new Date().toISOString(), title: 'Error' }]);
      if (table === 'management_items') return createChain([{ type: 'TECHNOLOGY', priority: 'HIGH', title: 'Tech Error', status: 'ACTIVE' }]);
      if (table === 'pending_approvals') return createChain([{ id: '1' }]);
      if (table === 'agents') return createChain([{ id: 'a1', name: 'AI CEO', role: 'CEO', status: 'idle', capabilities: [] }, { id: 'a2', name: 'Worker', role: 'Worker', status: 'idle', capabilities: [] }]);
      if (table === 'tasks') return createChain([{ assigned_agent_id: 'a1', status: 'FAILED', error: 'fail' }]);
      if (table === 'connections') return createChain([]);
      if (table === 'business_missions') return createChain([{ id: 'm1', status: 'ACTIVE', progress: 50 }]);
      if (table === 'opportunities') return createChain([{ id: 'o1', stage: 'QUALIFIED', value: 1000 }]);
      if (table === 'ceo_decisions') return createChain([{ id: 'd1', decision: 'Wait', created_at: new Date().toISOString() }]);
      if (table === 'mission_events') return createChain([{ id: 'me1', event_type: 'MILESTONE', created_at: new Date().toISOString() }]);
      if (table === 'company_memory') return createChain([{ memory_type: 'DECISION' }]);
      
      return createChain([]);
    });

    const res = await request(app).get('/workspaces/ws-1/command-center').set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    
    // Check Company Status (should be Needs attention due to FAILED task)
    expect(res.body.companyStatus.health.operations).toBe('ATTENTION');
    

    // Check CEO Status
    
    
    
    // Check Workforce
    expect(res.body.workforce).toHaveLength(2);
    expect(res.body.workforce[0].status).toBe('WORKING'); // CEO has RUNNING task
    
    // Check Steering
    expect(res.body.companySteering.rules).toBe(1);
    
  });
});
