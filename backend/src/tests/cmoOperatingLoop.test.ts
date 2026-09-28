import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CMOService } from '../services/CMOService';

vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: vi.fn().mockImplementation(async (req: any) => {
            const prompt = req.messages[0].content;
            if (prompt.includes('You are the CMO evaluating customer acquisition.')) {
              return { choices: [{ message: { content: JSON.stringify({
                knownFacts: ['We have 0 converted opportunities'],
                inferences: ['Conversion is the bottleneck'],
                insufficientData: [],
                currentBottleneck: 'Conversion Rate'
              }) } }] };
            } else if (prompt.includes('You are the CMO creating a structured customer acquisition plan.')) {
              return { choices: [{ message: { content: JSON.stringify({
                objective: 'Improve Conversion',
                strategy: 'Run lead research and outreach',
                actions: [{
                  actionType: 'LEAD_RESEARCH',
                  purpose: 'Find qualified leads',
                  authorityRequired: 'AUTONOMOUS',
                  reversibility: 'REVERSIBLE',
                  verificationMethod: 'Check opportunities table'
                }]
              }) } }] };
            }
            return { choices: [{ message: { content: '{}' } }] };
          })
        }
      }
    }
  }
});

vi.mock('../services/MissionPlanningService', () => ({
  MissionPlanningService: {
    createPlan: vi.fn().mockResolvedValue({ plan: { id: 'plan-1' }, steps: [] })
  }
}));

describe('CMO Operating Loop (V3.11)', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn((table: string) => {
        let currentData: any = { data: [] };
        
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => Promise.resolve({ data: currentData.data[0] || {} })),
          then: vi.fn().mockImplementation((resolve) => resolve(currentData)),
          insert: vi.fn().mockImplementation((payload) => Promise.resolve({ data: payload }))
        };
        
        if (table === 'business_goals') {
          currentData = { data: [{ id: 'goal-1', objective: 'Get me 20 new customers', target: 20 }] };
        } else if (table === 'opportunities') {
          currentData = { data: [], count: 7 };
        } else if (table === 'business_missions') {
          currentData = { data: [] };
          chain.insert = vi.fn().mockImplementation((payload) => {
              return { select: () => ({ single: () => Promise.resolve({ data: { id: 'mission-1' } }) }) };
          });
        }
        
        return chain;
      })
    };
  });

  it('TEST: CMO receives customer acquisition objective and creates plan', async () => {
    const contract = await CMOService.operateCustomerAcquisition(mockSupabase, 'ws-1', 'goal-1');
    
    expect(contract.executiveRole).toBe('CMO');
    expect(contract.currentMetrics.convertedCount).toBe(7);
    expect(contract.diagnostic.currentBottleneck).toBe('Conversion Rate');
    expect(contract.plan).toBeDefined();
    expect(contract.plan?.actions[0].actionType).toBe('LEAD_RESEARCH');
  });
});
