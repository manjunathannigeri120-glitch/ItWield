import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CEOService } from '../services/CEOService';
import { schedulerRouter } from '../api/scheduler';
import express from 'express';
import request from 'supertest';
import { getServiceSupabase } from '../db/supabaseClient';

vi.mock('../db/supabaseClient', () => ({
  getServiceSupabase: vi.fn()
}));

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
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
    mockSupabase.single.mockResolvedValue({ data: {} }); // For workflows update

    const res = await request(app)
      .post('/api/v1/scheduler/tick')
      .set('Authorization', 'Bearer dev-secret');
      
    expect(res.status).toBe(200);
    expect(res.body.triggered).toBe(0); // It skips zero workspace

    // Check it updated to suspended
    expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'suspended', next_run_at: null });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'w1');
  });

});
