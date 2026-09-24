import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CEOService } from '../services/CEOService';
import { schedulerRouter } from '../api/scheduler';
import express from 'express';
import request from 'supertest';
import { getServiceSupabase } from '../db/supabaseClient';

vi.mock('../db/supabaseClient', () => ({
  getServiceSupabase: vi.fn()
}));

vi.mock('openai', () => {
  return {
    OpenAI: vi.fn().mockImplementation(() => ({
      chat: { completions: { create: vi.fn().mockRejectedValue({ status: 429, message: '429 Rate limit exceeded' }) } }
    }))
  };
});

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis()
};

const app = express();
app.use(express.json());
app.use('/api/v1/scheduler', schedulerRouter);

describe('Scheduler & Rate Limit 429 Regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServiceSupabase as any).mockReturnValue(mockSupabase);
  });

  it('1. zero workspace observation cannot invoke CEO and is suspended', async () => {
    mockSupabase.limit.mockResolvedValueOnce({
      data: [
        { id: 'w1', workspace_id: '00000000-0000-0000-0000-000000000000', definition: { schedule: '0 * * * *' }, status: 'active' }
      ]
    });
    mockSupabase.single.mockResolvedValueOnce({ data: {} }); 

    const res = await request(app)
      .post('/api/v1/scheduler/tick')
      .set('Authorization', 'Bearer dev-secret');
      
    expect(res.status).toBe(200);
    // Check update was called with these arguments
    const updateCalls = mockSupabase.update.mock.calls;
    const suspendedCall = updateCalls.find((args: any[]) => args[0].status === 'suspended');
    expect(suspendedCall).toBeDefined();
    expect(suspendedCall[0].next_run_at).toBeNull();
  });

  it('2. Missing workspace quarantines observation', async () => {
    mockSupabase.limit.mockResolvedValueOnce({
      data: [
        { id: 'w2', workspace_id: 'missing-ws', definition: { schedule: '0 * * * *' }, status: 'active' }
      ]
    });
    mockSupabase.single
      .mockResolvedValueOnce({ error: { code: 'PGRST116' } }) // Workspace lookup fails
      .mockResolvedValueOnce({ data: {} }); // workflows update

    const res = await request(app).post('/api/v1/scheduler/tick').set('Authorization', 'Bearer dev-secret');
    expect(res.status).toBe(200);
    const updateCalls = mockSupabase.update.mock.calls;
    const suspendedCall = updateCalls.find((args: any[]) => args[0].status === 'suspended');
    expect(suspendedCall).toBeDefined();
  });

  it('3. OpenRouter 429 does not cause infinite retry and records provider blocked state', async () => {
    mockSupabase.single.mockResolvedValue({ data: { id: 'workspace-1', status: 'operating' } });
    
    const origEnv = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = 'test';
    
    await expect(CEOService.run(mockSupabase as any, 'workspace-1', 'Do something AI')).resolves.toBeUndefined();
    
    const updateCalls = mockSupabase.update.mock.calls;
    const opsCall = updateCalls.find((args: any[]) => args[0].status === 'operating');
    expect(opsCall).toBeDefined();

    const insertCalls = mockSupabase.insert.mock.calls;
    const rateLimitCall = insertCalls.find((args: any[]) => args[0].event_type === 'PROVIDER_RATE_LIMIT');
    expect(rateLimitCall).toBeDefined();

    process.env.OPENROUTER_API_KEY = origEnv;
  });
});
