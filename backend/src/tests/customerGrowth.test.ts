import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerGrowthService } from '../services/CustomerGrowthService';
import { CompanyMemoryService } from '../services/CompanyMemoryService';
import { MissionLearningService } from '../services/MissionLearningService';

vi.mock('../services/CompanyMemoryService');
vi.mock('../services/MissionLearningService');

describe('Customer Growth Engine', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSupabase: any = {
    from: vi.fn()
  };

  it('1. Records prospect response and updates CRM stage', async () => {
    const mockOpp = {
      id: 'opp-1',
      workspace_id: 'ws-1',
      contact_history: []
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: mockOpp, error: null });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockUpdateSelect = vi.fn().mockReturnThis();
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: { ...mockOpp, stage: 'RESPONDED', response_status: 'RECEIVED' },
      error: null
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'opportunities') {
        return {
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
          update: mockUpdate,
          insert: vi.fn()
        };
      }
    });
    
    // Wire the update mock chain
    mockUpdate.mockReturnValue({ eq: vi.fn().mockReturnValue({ select: mockUpdateSelect }) });
    mockUpdateSelect.mockReturnValue({ single: mockUpdateSingle });

    const result = await CustomerGrowthService.recordResponse(mockSupabase, 'ws-1', 'opp-1', 'I am interested', 'Potential fit');
    
    expect(result.stage).toBe('RESPONDED');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'RESPONDED',
      response_status: 'RECEIVED',
      ai_classification: 'Potential fit'
    }));
  });

  it('2. Records VERIFIED WON conversion and triggers Memory/Learning loops', async () => {
    const mockOpp = {
      id: 'opp-2',
      workspace_id: 'ws-1',
      mission_id: 'mission-1',
      mission_result_id: 'res-1',
      company_name: 'Acme Corp',
      evidence: { reason_for_match: 'High budget' }
    };

    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: { ...mockOpp, stage: 'WON' },
      error: null
    });

    mockSupabase.from.mockImplementation(() => {
      return {
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: mockOpp, error: null }) }) }) }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockUpdateSingle }) }) })
      };
    });

    await CustomerGrowthService.recordConversion(mockSupabase, 'ws-1', 'opp-2', 'WON', 'Signed contract', '$10k ARR');

    // Verify Company Memory was called
    expect(CompanyMemoryService.recordOutcome).toHaveBeenCalledWith(
      'ws-1',
      'Opportunity WON: Acme Corp',
      expect.stringContaining('Evidence: Signed contract. Value: $10k ARR'),
      'opp-2',
      'OWNER',
      mockSupabase
    );

    // Verify Mission Learning Pipeline was fed
    expect(MissionLearningService.persistLearnings).toHaveBeenCalledWith(
      mockSupabase,
      'ws-1',
      'mission-1',
      expect.arrayContaining([
        expect.objectContaining({
          memory_type: 'OBSERVATION',
          status: 'VERIFIED'
        })
      ])
    );
  });
});
