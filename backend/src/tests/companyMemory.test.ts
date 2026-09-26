import { describe, it, expect, vi } from 'vitest';
import { CompanyMemoryService } from '../services/CompanyMemoryService';
import { AuthorizationRegistry } from '../services/AuthorizationRegistry';

describe('Company Memory / Operational Memory V3.2', () => {

  it('1. Memory Creation - Reject Secrets', async () => {
    let error;
    try {
      await CompanyMemoryService.createMemory({
        workspaceId: 'ws-1',
        memoryType: 'FACT',
        category: 'FACT',
        title: 'Secret Fact',
        content: 'The password is password123',
        sourceType: 'SYSTEM',
        createdBy: 'SYSTEM'
      }, {} as any);
    } catch (e: any) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.message).toContain('secrets');
  });

  it('2. CEO Retrieval - Formats Context Correctly with Priority', () => {
    const memories = [
      {
        id: 'mem-1',
        workspace_id: 'ws-1',
        memory_type: 'DECISION',
        title: 'Focus on SMB SaaS',
        content: 'Owner decided to focus on SMB SaaS.',
        source_type: 'OWNER',
        created_at: '2026-09-01T12:00:00Z',
        importance: 'high',
        status: 'active'
      },
      {
        id: 'mem-2',
        workspace_id: 'ws-1',
        memory_type: 'RULE',
        title: 'No Weekend Outreach',
        content: 'Never contact prospects on weekends.',
        source_type: 'OWNER',
        created_at: '2026-09-02T12:00:00Z',
        importance: 'high',
        status: 'active'
      },
      {
        id: 'mem-3',
        workspace_id: 'ws-1',
        memory_type: 'INCIDENT',
        title: 'Site Outage',
        content: 'Application was down for 5 mins.',
        source_type: 'INCIDENT',
        created_at: '2026-09-03T12:00:00Z',
        importance: 'high',
        status: 'active'
      }
    ];

    const context = CompanyMemoryService.formatMemoryForContext(memories);
    expect(context).toContain('COMPANY MEMORY & OWNER DIRECTIVES');
    expect(context).toContain('>>> [OWNER RULE] No Weekend Outreach <<<');
    expect(context).toContain('>>> [OWNER DECISION] Focus on SMB SaaS <<<');
    expect(context).toContain('[INCIDENT] Site Outage');
  });

  it('3. Owner steering cannot override AuthorizationRegistry (Pricing Protection)', async () => {
    // Even if memory says we can change pricing, AuthorizationRegistry must block it
    const evaluation = AuthorizationRegistry.authorize('CHANGE_PRICING', {
      can_change_pricing: true
    });
    expect(evaluation.authorized).toBe(false);
    expect(evaluation.reason).toContain('blocked');
  });

  it('4. Priority retrieval correctly sorts OWNER rules to the top', async () => {
    const mockDb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            in: () => ({
              order: () => ({
                limit: async () => ({
                  data: [
                    { memory_type: 'INCIDENT', source_type: 'SYSTEM', created_at: '2026-09-05' },
                    { memory_type: 'FACT', source_type: 'SYSTEM', created_at: '2026-09-04' },
                    { memory_type: 'RULE', source_type: 'OWNER', created_at: '2026-09-01' }, 
                    { memory_type: 'DECISION', source_type: 'OWNER', created_at: '2026-09-02' }
                  ],
                  error: null
                })
              })
            })
          })
        })
      })
    };

    const results = await CompanyMemoryService.getRelevantMemory('ws-1', 'CEO', 20, mockDb as any);
    expect(results).toBeDefined();
    if(results && results.length > 0) {
      expect(results[0].memory_type).toBe('RULE');
      expect(results[0].source_type).toBe('OWNER');
      expect(results[1].memory_type).toBe('DECISION');
      expect(results[1].source_type).toBe('OWNER');
      expect(results[2].memory_type).toBe('INCIDENT');
    }
  });
});
