import { describe, it, expect, vi } from 'vitest';
import { CEOService } from '../services/CEOService';

describe('Business Missions Orchestration', () => {
  it('handles multiple ACTIVE missions concurrently without duplicating or overwriting', async () => {
    let workspaceStatus = 'operating';
    const mockMissions = [
      { id: 'mission-1', type: 'GET_CUSTOMERS', status: 'ACTIVE' },
      { id: 'mission-2', type: 'UNDERSTAND_COMPETITORS', status: 'ACTIVE' }
    ];
    let mockTasks: any[] = [];
    
    let runCalls: any[] = [];

    // Mock CEOService.run to simulate task creation
    vi.spyOn(CEOService, 'run').mockImplementation(async (supabase, workspaceId, objective, userId, sourceWorkflowId, actualNextRunAt, missionId) => {
      runCalls.push({ objective, missionId });
      // Simulate task creation
      mockTasks.push({ id: `task-${missionId}`, mission_id: missionId, status: 'PENDING' });
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { id: 'ws-1' } }) // simulates lock acquisition
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { id: 'ws-1', company_goals: 'test' } })
            })
          };
        }
        if (table === 'business_missions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: (cb: any) => cb({ data: mockMissions })
          };
        }
        if (table === 'tasks') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            then: (cb: any) => cb({ data: mockTasks }) // Returns the mockTasks dynamically!
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
          then: (cb: any) => cb({ data: null })
        };
      })
    };

    // First scheduler tick
    await CEOService.observeWorkspace(mockSupabase as any, 'ws-1');

    // Expected: It should spawn a task for mission-1 (GET_CUSTOMERS) -> LEAD_RESEARCH
    expect(runCalls.length).toBe(1);
    expect(runCalls[0].objective).toBe('SCHEDULED_OBSERVATION:LEAD_RESEARCH');
    expect(runCalls[0].missionId).toBe('mission-1');

    // Second scheduler tick (mission-1 now has an active task, so it should be skipped, and mission-2 picked)
    await CEOService.observeWorkspace(mockSupabase as any, 'ws-1');

    expect(runCalls.length).toBe(2);
    expect(runCalls[1].objective).toBe('SCHEDULED_OBSERVATION:COMPETITIVE_ANALYSIS');
    expect(runCalls[1].missionId).toBe('mission-2');

    // Third scheduler tick (both missions have active tasks, so neither should trigger)
    await CEOService.observeWorkspace(mockSupabase as any, 'ws-1');
    expect(runCalls.length).toBe(2);
  });
});

