import { describe, it, expect, vi, beforeEach } from 'vitest';
import { schedulerRouter } from '../api/scheduler';
import express from 'express';
import request from 'supertest';
import { getServiceSupabase } from '../db/supabaseClient';
import { CEOService } from '../services/CEOService';

vi.mock('../db/supabaseClient', () => ({
  getServiceSupabase: vi.fn()
}));

vi.mock('../services/CEOService', () => ({
  CEOService: {
    run: vi.fn().mockResolvedValue(true),
    observeWorkspace: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../services/IntelligenceService', () => ({
  IntelligenceService: {
    generateSnapshot: vi.fn().mockResolvedValue({}),
    detectAnomalies: vi.fn().mockReturnValue([]),
    syncIncidents: vi.fn().mockResolvedValue(false)
  }
}));

const mockSupabase: any = {
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

let eqArgs: any[] = [];
let fromArgs: any[] = [];

mockSupabase.from.mockImplementation((table: string) => {
    fromArgs.push(table);
    return mockSupabase;
});

mockSupabase.eq.mockImplementation((key: string, val: any) => {
    eqArgs.push([key, val]);
    return mockSupabase;
});

mockSupabase.then = (resolve: any) => {
    const table = fromArgs[fromArgs.length - 1];
    
    if (table === 'workflows') {
        resolve({ data: [] });
    } else if (table === 'tasks') {
        resolve({ data: [] });
    } else if (table === 'workspaces') {
        resolve({ data: [{ id: 'test-ws', status: 'operating' }] });
    } else {
        resolve({ data: [] });
    }
};

const app = express();
app.use(express.json());
app.use('/api/v1/scheduler', schedulerRouter);

describe('Scheduler Empty Candidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getServiceSupabase as any).mockReturnValue(mockSupabase);
    process.env.SCHEDULER_SECRET = 'dev-secret';
    eqArgs = [];
    fromArgs = [];
  });

  it('proceeds to Phase 4 even when Phase 1 workflow candidates is empty', async () => {
    const res = await request(app)
      .post('/api/v1/scheduler/tick')
      .set('Authorization', 'Bearer dev-secret');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(CEOService.observeWorkspace).toHaveBeenCalledWith(mockSupabase, 'test-ws');
  });
});

