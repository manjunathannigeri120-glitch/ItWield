import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessGoalInterpreter } from '../services/BusinessGoalInterpreter';
import { SupabaseClient } from '@supabase/supabase-js';

vi.mock('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: vi.fn().mockImplementation(async (req: any) => {
            const prompt = req.messages[0].content;
console.log(prompt);
            
            let mockResponse = {
              intent_type: 'OUTCOME',
              scope: 'OWN_COMPANY',
              request_type: 'OUTCOME',
              objective: 'Fallback',
              success_definition: 'Mock',
              required_company_context: [] as string[],
              missing_company_context: [] as string[],
              external_information_required: [] as string[],
              website_required: false,
              reason: 'Mock',
              confidence: 0.95
            };

            if (prompt.includes('business request: "Get me 20 new customers"') && prompt.includes('https://mycompany.com')) {
               mockResponse = { ...mockResponse, scope: 'OWN_COMPANY', website_required: false, missing_company_context: [] };
            } else if (prompt.includes('business request: "What is CAC?"')) {
               mockResponse = { ...mockResponse, scope: 'GENERAL', request_type: 'QUESTION', website_required: false, missing_company_context: [] };
            } else if (prompt.includes('business request: "Find new markets for my business"') && !prompt.includes('https://mycompany.com')) {
               mockResponse = { ...mockResponse, scope: 'EXTERNAL_BUSINESS', website_required: true, missing_company_context: ['website', 'industry'] };
            }

            return {
              choices: [{ message: { content: JSON.stringify(mockResponse) } }]
            };
          })
        }
      }
    }
  }
});

describe('Business Context Intake Rules', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [] }),
      insert: vi.fn().mockResolvedValue({ data: { id: 'goal-123' } }),
      single: vi.fn().mockResolvedValue({ data: { id: 'goal-123' } })
    };
  });

  it('TEST A: Does not ask for website if it is already known (Get me 20 new customers)', async () => {
    const memorySummary = { website: 'https://mycompany.com', industry: 'SaaS' };
    const res = await BusinessGoalInterpreter.interpretGoal(mockSupabase, 'ws-1', 'Get me 20 new customers', memorySummary);
    
    expect(res.scope).toBe('OWN_COMPANY');
    expect(res.website_required).toBe(false);
    expect(res.missing_company_context.length).toBe(0);
  });

  it('TEST H: General questions do not require website (What is CAC?)', async () => {
    const memorySummary = {}; // No context exists
    const res = await BusinessGoalInterpreter.interpretGoal(mockSupabase, 'ws-1', 'What is CAC?', memorySummary);
    
    expect(res.scope).toBe('GENERAL');
    expect(res.website_required).toBe(false);
  });

  it('TEST F: External research missing context asks for website', async () => {
    const memorySummary = {}; // Missing context
    const res = await BusinessGoalInterpreter.interpretGoal(mockSupabase, 'ws-1', 'Find new markets for my business', memorySummary);
    
    expect(res.scope).toBe('EXTERNAL_BUSINESS');
    expect(res.website_required).toBe(true);
    expect(res.missing_company_context).toContain('website');
  });
});



