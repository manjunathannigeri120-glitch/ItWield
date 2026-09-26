import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CapabilityRegistry } from '../services/CapabilityRegistry';
import { WorkforceIntegrityService } from '../services/WorkforceIntegrityService';

describe('Workforce Integrity & Capability Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Part 2 - Normalization & Registration', () => {
    it('normalizes capabilities deterministically', () => {
      expect(CapabilityRegistry.normalize('competitive_analysis')).toBe('COMPETITIVE_ANALYSIS');
      expect(CapabilityRegistry.normalize('Competitive Analysis')).toBe('COMPETITIVE_ANALYSIS');
      expect(CapabilityRegistry.normalize(' COMPETITOR_RESEARCH ')).toBe('COMPETITOR_RESEARCH');
      // Verify historical explicit alias map
      expect(CapabilityRegistry.normalize('COMPETITOR_ANALYSIS')).toBe('COMPETITIVE_ANALYSIS');
    });

    it('exposes a registered capability', () => {
      const cap = CapabilityRegistry.get('COMPETITIVE_ANALYSIS');
      expect(cap).toBeDefined();
      expect(cap?.name).toBe('Competitive Analysis');
      expect(cap?.owningAction).toBe('COMPETITIVE_ANALYSIS');
    });

    it('validates action to capability mapping', () => {
      expect(CapabilityRegistry.getRequiredCapabilityForAction('COMPETITIVE_ANALYSIS')).toBe('COMPETITIVE_ANALYSIS');
      expect(CapabilityRegistry.getRequiredCapabilityForAction('GITHUB_LIST_ISSUES')).toBe('GITHUB_LIST_ISSUES');
    });
  });

  describe('Part 14 - Historical Regression: COMPETITIVE_ANALYSIS', () => {
    it('prevents assigning COMPETITIVE_ANALYSIS task to a worker with only COMPETITOR_RESEARCH', async () => {
      const mockSupabase: any = {
        from: vi.fn((table) => {
          if (table === 'agents') {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'agent_cmo_analyst',
                  name: 'Competitor Analyst',
                  capabilities: ['COMPETITOR_RESEARCH', 'WEB_RESEARCH'] // Historical flaw
                }
              })
            };
          }
          return {
             select: vi.fn().mockReturnThis(),
             eq: vi.fn().mockReturnThis(),
             single: vi.fn().mockResolvedValue({ data: null })
          };
        })
      };

      const result = await WorkforceIntegrityService.validateAssignment(
        mockSupabase,
        'workspace_1',
        'agent_cmo_analyst',
        'COMPETITIVE_ANALYSIS' // Task requires this
      );

      expect(result.valid).toBe(false);
      expect(result.status).toBe('MISSING_CAPABILITY');
      expect(result.reason).toContain('missing required capability: COMPETITIVE_ANALYSIS');
      expect(result.reason).toContain('Declared: COMPETITOR_RESEARCH, WEB_RESEARCH');
    });

    it('allows assigning COMPETITIVE_ANALYSIS task to a worker with COMPETITIVE_ANALYSIS capability', async () => {
        const mockSupabase: any = {
          from: vi.fn((table) => {
            if (table === 'agents') {
              return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'agent_cmo_analyst_fixed',
                    name: 'Competitor Analyst',
                    capabilities: ['COMPETITIVE_ANALYSIS', 'WEB_RESEARCH'] // Fixed config
                  }
                })
              };
            }
            if (table === 'connections') {
              return {
                 select: vi.fn().mockReturnThis(),
                 eq: vi.fn().mockReturnThis(),
                 single: vi.fn().mockResolvedValue({ data: null }) // no connections needed for this base mock
              };
            }
            return {};
          })
        };
  
        const result = await WorkforceIntegrityService.validateAssignment(
          mockSupabase,
          'workspace_1',
          'agent_cmo_analyst_fixed',
          'COMPETITIVE_ANALYSIS'
        );
  
        // We expect it to be VALID because there is no requiredConnection for COMPETITIVE_ANALYSIS natively (or it's web_search which checks env)
        // If web_search is required, in test env it skips the key check.
        // Actually auth registry sets readOnly, etc.
        expect(result.status).not.toBe('MISSING_CAPABILITY');
        // Depending on test env TAVILY_API_KEY, it might be valid
        // But the primary assertion is that it DOES NOT block on MISSING_CAPABILITY
      });
  });

  describe('Part 10 - Workforce Readiness', () => {
    it('evaluates readiness states correctly', async () => {
        const mockSupabase: any = {
            from: vi.fn((table) => {
              if (table === 'agents') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockResolvedValue({
                    data: [
                      { id: '1', name: 'Ready Worker', capabilities: ['WEB_RESEARCH'] },
                      { id: '2', name: 'Working Worker', capabilities: ['DATA_TRANSFORMATION'] },
                      { id: '3', name: 'Misconfigured Worker', capabilities: ['FAKE_BOGUS_CAPABILITY'] },
                      { id: '4', name: 'Blocked Worker', capabilities: ['GITHUB_LIST_ISSUES'] }, // Needs github connection
                    ]
                  })
                };
              }
              if (table === 'tasks') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  in: vi.fn().mockResolvedValue({
                    data: [
                      { assigned_agent_id: '2', status: 'RUNNING' }
                    ]
                  })
                };
              }
              if (table === 'connections') {
                return {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockResolvedValue({
                    data: [
                        // No github connection
                    ]
                  })
                };
              }
              return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
            })
          };

          const readiness = await WorkforceIntegrityService.evaluateWorkforceReadiness(mockSupabase, 'ws_1');
          
          expect(readiness).toHaveLength(4);
          
          const readyWorker = readiness.find(r => r.id === '1');
          expect(readyWorker.state).toBe('READY');

          const workingWorker = readiness.find(r => r.id === '2');
          expect(workingWorker.state).toBe('WORKING');

          const misconfWorker = readiness.find(r => r.id === '3');
          expect(misconfWorker.state).toBe('MISCONFIGURED');
          expect(misconfWorker.capabilities.invalid).toContain('FAKE_BOGUS_CAPABILITY');

          const blockedWorker = readiness.find(r => r.id === '4');
          expect(blockedWorker.state).toBe('BLOCKED');
          expect(blockedWorker.capabilities.missingConns).toContain('github');
    });
  });

});
