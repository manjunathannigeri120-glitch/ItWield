import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissionResultPipelineService } from '../services/MissionResultPipelineService';
import { OutreachDraftingAction } from '../workflows/actions/OutreachDraftingAction';
import { AwaitOutreachApprovalsAction } from '../workflows/actions/AwaitOutreachApprovalsAction';
import { ProviderFactory } from '../ai/providerFactory';

vi.mock('../ai/providerFactory');

describe('CRM Pipeline & Outreach Execution', () => {
  let mockSupabase: any;
  let mockProvider: any;

  beforeEach(() => {
    // Create a deeply chainable mock
    const chainable = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn((resolve) => resolve({ data: [], error: null })) // Default empty resolve
    };
    mockSupabase = chainable;

    mockProvider = {
      generateText: vi.fn().mockResolvedValue({ text: JSON.stringify({ subject: 'Hello', body: 'Body', recipient: 'test@test.com', reason_for_contact: 'Match' }) })
    };
    (ProviderFactory.getInstance as any).mockReturnValue(mockProvider);
  });

  it('1. verified prospect creates opportunity', async () => {
    mockSupabase.upsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ 
        data: [{ id: 'mr1', result_type: 'QUALIFIED_PROSPECT', verification_status: 'VERIFIED', workspace_id: 'ws1', evidence: { company_name: 'Test Corp', public_website: 'test.com' } }], 
        error: null 
      })
    });

    const results = [{ result_type: 'QUALIFIED_PROSPECT', verification_status: 'VERIFIED', workspace_id: 'ws1', evidence: { company_name: 'Test Corp' } }];
    await MissionResultPipelineService.persistResults(mockSupabase, results);
    expect(mockSupabase.from).toHaveBeenCalledWith('opportunities');
  });

  it('4. valid outreach draft is stored and creates approval', async () => {
    // Override the thenable for this specific test
    mockSupabase.then = vi.fn((resolve) => resolve({ data: [{ id: 'opp1', company_name: 'Test Corp', website: 'test.com' }], error: null }));

    const action = new OutreachDraftingAction();
    const result = await action.execute({ mission_id: 'm1' }, { supabase: mockSupabase, workspaceId: 'ws1', runId: '', userId: '', attempt: 1 } as any);
    
    expect(result.success).toBe(true);
    expect(result.draftedCount).toBe(1);
    expect(mockSupabase.from).toHaveBeenCalledWith('approvals');
    expect(mockSupabase.insert).toHaveBeenCalled();
  });

  it('awaiting approvals keeps step blocked', async () => {
    mockSupabase.then = vi.fn((resolve) => resolve({ data: [{ id: 'opp1', stage: 'AWAITING_APPROVAL' }], error: null }));

    const action = new AwaitOutreachApprovalsAction();
    const result = await action.execute({ mission_id: 'm1' }, { supabase: mockSupabase, workspaceId: 'ws1', runId: '', userId: '', attempt: 1 } as any);
    
    expect(result.success).toBe(false);
    expect(result.pendingCount).toBe(1);
  });
});
