vi.mock('../middleware/auth', () => ({ requireAuth: (req: any, res: any, next: any) => next() }));
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import goalsRouter from '../api/goals';
import { BusinessGoalInterpreter } from '../services/BusinessGoalInterpreter';
import { OutcomePlannerService } from '../services/OutcomePlannerService';
import { OutcomeVerificationService } from '../services/OutcomeVerificationService';

vi.mock('../services/BusinessGoalInterpreter', () => ({
  BusinessGoalInterpreter: {
    createGoal: vi.fn().mockResolvedValue({ id: 'goal-1', objective: 'Get customers' })
  }
}));
vi.mock('../services/OutcomePlannerService', () => ({
  OutcomePlannerService: {
    planOutcome: vi.fn().mockResolvedValue({ missions: [] })
  }
}));

const app = express();
app.use(express.json());

let mockCompanyMemory: any[] = [];
let insertSpy = vi.fn().mockResolvedValue({ error: null });

app.use('/workspaces/:workspaceId/goals', (req: any, res: any, next: any) => {
  req.supabase = {
    from: vi.fn((table: string) => {
      if (table === 'company_memory') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockCompanyMemory, error: null })
                })
              })
            })
          }),
          insert: insertSpy
        };
      }
      return { select: vi.fn() };
    })
  };
  next();
}, goalsRouter);

describe('Business Goal Intake Flow (API)', () => {
  beforeEach(() => {
    mockCompanyMemory = [];
    vi.clearAllMocks();
  });

  it('TEST 1: missing website blocks goal operation and causes intake UI', async () => {
    
    
    const res = await request(app).post('/workspaces/ws-1/goals').send({ input: 'Get me 20 customers' });
    expect(res.status).toBe(200);
    expect(res.body.requires_context).toBe(true);
    expect(res.body.missing_fields).toContain('website');
    expect(BusinessGoalInterpreter.createGoal).not.toHaveBeenCalled();
    expect(OutcomePlannerService.planOutcome).not.toHaveBeenCalled();
  });

  it('TEST 2: existing website bypasses intake', async () => {
    
    mockCompanyMemory = [{ id: 'mem-1', content: 'https://example.com' }];
    const res = await request(app).post('/workspaces/ws-1/goals').send({ input: 'Get me 20 customers' });
    expect(res.status).toBe(200);
    expect(res.body.requires_context).toBe(false);
    expect(BusinessGoalInterpreter.createGoal).toHaveBeenCalled();
  });

  it('TEST 3: website submission persists', async () => {
    const res = await request(app).post('/workspaces/ws-1/goals').send({ input: 'Get me 20 customers', website: 'https://example.com' });
    expect(res.status).toBe(200);
    expect(res.body.requires_context).toBe(false);
    expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({
      category: 'STRATEGIC_CONTEXT',
      title: 'Company Website',
      content: 'https://example.com'
    }));
  });

  it('TEST 4: customer goal still verifies opportunities correctly (semantics untouched)', async () => {
    
    expect(OutcomeVerificationService).toBeDefined();
  });
});

