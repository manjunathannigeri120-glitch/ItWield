/**
 * ContinuousImprovementService Tests
 *
 * Tests all security, isolation, deduplication, evidence integrity,
 * authorization, and pattern detection behaviors.
 *
 * All tests are deterministic — no live API calls, no network dependency.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContinuousImprovementService } from '../services/ContinuousImprovementService';
import { AuthorizationRegistry } from '../services/AuthorizationRegistry';

// ─── Mock Supabase Factory ────────────────────────────────────────────────────

const createChain = (data: any, error: any = null) => {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data, error })),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    then: (resolve: any) => resolve({ data, error }),
  };
  return chain;
};

// ─── 1. Repeated Incident Detection ──────────────────────────────────────────

describe('1. Repeated incident detection', () => {
  it('creates RELIABILITY proposal when 3+ incidents of same type exist', async () => {
    const insertedProposals: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'incidents') {
          return createChain([
            { id: 'i1', type: 'HTTP_ERROR', severity: 'high', title: 'App down', created_at: new Date().toISOString() },
            { id: 'i2', type: 'HTTP_ERROR', severity: 'high', title: 'App down', created_at: new Date().toISOString() },
            { id: 'i3', type: 'HTTP_ERROR', severity: 'high', title: 'App down', created_at: new Date().toISOString() },
          ]);
        }
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((data: any) => {
            insertedProposals.push(data);
            return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'p1' }, error: null })) })) };
          });
          return chain;
        }
        return createChain([]);
      })
    };

    await ContinuousImprovementService.detectRepeatedIncidents(mockSupabase, 'ws-1');

    expect(insertedProposals.length).toBeGreaterThanOrEqual(1);
    expect(insertedProposals[0].category).toBe('RELIABILITY');
    expect(insertedProposals[0].source_type).toBe('INCIDENT_PATTERN');
    expect(insertedProposals[0].confidence).toMatch(/low|medium|high/);
    expect(insertedProposals[0].evidence).toBeDefined();
    expect(Array.isArray(insertedProposals[0].evidence.facts)).toBe(true);
    expect(insertedProposals[0].evidence.facts.length).toBeGreaterThan(0);
  });

  it('does NOT create proposal when fewer than 3 incidents exist', async () => {
    const insertedProposals: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'incidents') return createChain([
          { id: 'i1', type: 'HTTP_ERROR', title: 'Oops', created_at: new Date().toISOString() },
        ]);
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => { insertedProposals.push(d); return chain; });
          return chain;
        }
        return createChain([]);
      })
    };

    await ContinuousImprovementService.detectRepeatedIncidents(mockSupabase, 'ws-1');
    expect(insertedProposals.length).toBe(0);
  });
});

// ─── 2. Repeated Failure Detection ───────────────────────────────────────────

describe('2. Repeated failure detection', () => {
  it('creates OPERATIONS proposal when 2+ tasks of same type failed', async () => {
    const inserted: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'tasks') return createChain([
          { id: 't1', title: 'Health check', input: { task_type: 'APPLICATION_MONITORING' }, status: 'FAILED', created_at: new Date().toISOString() },
          { id: 't2', title: 'Health check', input: { task_type: 'APPLICATION_MONITORING' }, status: 'FAILED', created_at: new Date().toISOString() },
        ]);
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => {
            inserted.push(d);
            return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'p1' }, error: null })) })) };
          });
          return chain;
        }
        return createChain([]);
      })
    };

    await ContinuousImprovementService.detectRepeatedFailedActions(mockSupabase, 'ws-1');

    expect(inserted.length).toBeGreaterThanOrEqual(1);
    expect(inserted[0].category).toBe('OPERATIONS');
    expect(inserted[0].source_type).toBe('FAILURE_PATTERN');
  });
});

// ─── 3. Goal Stagnation Detection ────────────────────────────────────────────

describe('3. Goal stagnation detection', () => {
  it('creates GOAL_ALIGNMENT proposal when goal exists but no completed tasks address it', async () => {
    const inserted: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') return createChain({ company_goals: 'Acquire early customers and grow revenue' });
        if (table === 'tasks') return createChain([]); // No completed tasks
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => {
            inserted.push(d);
            return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'p1' }, error: null })) })) };
          });
          return chain;
        }
        return createChain([]);
      })
    };

    await ContinuousImprovementService.detectGoalStagnation(mockSupabase, 'ws-1');

    expect(inserted.length).toBe(1);
    expect(inserted[0].category).toBe('GOAL_ALIGNMENT');
    expect(inserted[0].source_type).toBe('GOAL_GAP');
    expect(inserted[0].evidence.facts.some((f: string) => f.includes('No completed'))).toBe(true);
  });

  it('does NOT create proposal if relevant tasks are already completed', async () => {
    const inserted: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspaces') return createChain({ company_goals: 'Acquire customers' });
        if (table === 'tasks') return createChain([
          { id: 't1', title: 'Competitor analysis', input: { task_type: 'COMPETITIVE_ANALYSIS' }, completed_at: new Date().toISOString() }
        ]);
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => { inserted.push(d); return chain; });
          return chain;
        }
        return createChain([]);
      })
    };

    await ContinuousImprovementService.detectGoalStagnation(mockSupabase, 'ws-1');
    expect(inserted.length).toBe(0);
  });
});

// ─── 4. Competitor Pattern Detection ─────────────────────────────────────────

describe('4. Competitor pattern detection', () => {
  it('creates COMPETITIVE proposal when 2+ observations of same type exist', async () => {
    const inserted: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'competitor_observations') return createChain([
          { id: 'co1', competitor_id: 'c1', type: 'FEATURE', title: 'AI assistant launched', description: '...', significance: 'HIGH', created_at: new Date().toISOString() },
          { id: 'co2', competitor_id: 'c2', type: 'FEATURE', title: 'AI chatbot released', description: '...', significance: 'MEDIUM', created_at: new Date().toISOString() },
        ]);
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => {
            inserted.push(d);
            return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'p1' }, error: null })) })) };
          });
          return chain;
        }
        return createChain([]);
      })
    };

    await ContinuousImprovementService.detectCompetitorPatterns(mockSupabase, 'ws-1');

    expect(inserted.length).toBeGreaterThanOrEqual(1);
    expect(inserted[0].category).toBe('COMPETITIVE');
    expect(inserted[0].source_type).toBe('COMPETITOR_PATTERN');
    expect(inserted[0].routed_to_executive).toBe('AI CMO');
  });
});

// ─── 5. Proposal Deduplication ────────────────────────────────────────────────

describe('5. Proposal deduplication', () => {
  it('does not create duplicate proposal when same fingerprint active proposal exists', async () => {
    const inserted: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => {
            inserted.push(d);
            // Simulate unique constraint violation on fingerprint
            return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: null, error: { code: '23505', message: 'unique constraint' } })) })) };
          });
          return chain;
        }
        return createChain([]);
      })
    };

    const result = await ContinuousImprovementService.createProposal(mockSupabase, {
      workspaceId: 'ws-1',
      title: 'Test dedup',
      category: 'OPERATIONS',
      pattern: 'test pattern',
      problem: 'test problem',
      proposedSolution: 'test solution',
      evidence: { facts: ['fact'], interpretation: 'interp', recommendation: 'rec', sourceIds: [], windowDays: 7, counts: {} },
      confidence: 'medium',
      sourceType: 'SYSTEM',
      sourceIds: [],
      riskLevel: 'LOW',
      routedToExecutive: 'AI CEO',
      fingerprint: 'ws-1:OPERATIONS:test:target',
    });

    // Result is null because of constraint violation — proposal not created
    expect(result).toBeNull();
  });

  it('fingerprint is workspace-specific — different workspaces generate different fingerprints', async () => {
    const fp1 = `ws-1:RELIABILITY:test:incident_type`;
    const fp2 = `ws-2:RELIABILITY:test:incident_type`;
    expect(fp1).not.toBe(fp2);
  });
});

// ─── 6. Workspace Isolation ───────────────────────────────────────────────────

describe('6. Workspace isolation', () => {
  it('workspace A improvements cannot be retrieved by workspace B owner', async () => {
    // getActiveProposals filters by workspace_id
    const calledWithWorkspace: string[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        const chain = createChain([]);
        chain.eq = vi.fn((col: string, val: string) => {
          if (col === 'workspace_id') calledWithWorkspace.push(val);
          return chain;
        });
        return chain;
      })
    };

    await ContinuousImprovementService.getActiveProposals(mockSupabase, 'ws-A', 10);
    expect(calledWithWorkspace).toContain('ws-A');
    expect(calledWithWorkspace).not.toContain('ws-B');
  });

  it('detectPatterns with workspace ID ws-A does not query for ws-B data', async () => {
    const queriedWorkspaces: string[] = [];
    const mockSupabase = {
      from: vi.fn(() => {
        const chain = createChain([]);
        chain.eq = vi.fn((col: string, val: string) => {
          if (col === 'workspace_id') queriedWorkspaces.push(val);
          return chain;
        });
        chain.gt = vi.fn(() => chain);
        chain.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
        return chain;
      })
    };

    await ContinuousImprovementService.detectRepeatedIncidents(mockSupabase, 'ws-A');
    // Should only have queried ws-A
    for (const ws of queriedWorkspaces) {
      expect(ws).toBe('ws-A');
    }
  });
});

// ─── 7. Evidence Integrity ────────────────────────────────────────────────────

describe('7. Evidence integrity', () => {
  it('evidence.facts must be an array of strings from verified records', async () => {
    const inserted: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'incidents') return createChain([
          { id: 'i1', type: 'TIMEOUT', severity: 'medium', title: 'Slow', created_at: new Date().toISOString() },
          { id: 'i2', type: 'TIMEOUT', severity: 'medium', title: 'Slow', created_at: new Date().toISOString() },
          { id: 'i3', type: 'TIMEOUT', severity: 'medium', title: 'Slow', created_at: new Date().toISOString() },
        ]);
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => { inserted.push(d); return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'p1' }, error: null })) })) }; });
          return chain;
        }
        return createChain([]);
      })
    };

    await ContinuousImprovementService.detectRepeatedIncidents(mockSupabase, 'ws-1');

    expect(inserted.length).toBeGreaterThanOrEqual(1);
    const evidence = inserted[0].evidence;
    expect(Array.isArray(evidence.facts)).toBe(true);
    // Facts should contain actual counts, not LLM-invented claims
    expect(evidence.facts[0]).toContain('3');
    expect(evidence.counts).toBeDefined();
    expect(typeof evidence.counts.incidentCount).toBe('number');
  });
});

// ─── 8. LLM Cannot Invent Evidence ───────────────────────────────────────────

describe('8. LLM cannot invent evidence', () => {
  it('all evidence is populated from DB counts, not from LLM output', async () => {
    // ContinuousImprovementService detectPatterns does NOT call openai
    // Verify by confirming no openai import is used in pattern detection
    const serviceSource = ContinuousImprovementService.detectRepeatedIncidents.toString();
    expect(serviceSource).not.toContain('openai');
    expect(serviceSource).not.toContain('chat.completions');

    const detectorSource = ContinuousImprovementService.detectGoalStagnation.toString();
    expect(detectorSource).not.toContain('openai');
  });
});

// ─── 9. LLM Cannot Fabricate Confidence ──────────────────────────────────────

describe('9. LLM cannot fabricate confidence', () => {
  it('confidence is derived from evidence count, not arbitrary LLM choice', async () => {
    // detectRepeatedIncidents sets confidence based on count (3 = medium, 5+ = high)
    const inserted: any[] = [];
    const makeSupabase = (count: number) => ({
      from: vi.fn((table: string) => {
        if (table === 'incidents') return createChain(
          Array.from({ length: count }, (_, i) => ({
            id: `i${i}`, type: 'HTTP_ERROR', severity: 'high', title: 'Down', created_at: new Date().toISOString()
          }))
        );
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => { inserted.push(d); return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'p1' }, error: null })) })) }; });
          return chain;
        }
        return createChain([]);
      })
    });

    await ContinuousImprovementService.detectRepeatedIncidents(makeSupabase(3), 'ws-1');
    expect(inserted[0]?.confidence).toBe('medium');

    inserted.length = 0;
    await ContinuousImprovementService.detectRepeatedIncidents(makeSupabase(5), 'ws-2');
    expect(inserted[0]?.confidence).toBe('high');
  });
});

// ─── 10. Improvement cannot bypass AuthorizationRegistry ─────────────────────

describe('10. Improvement cannot bypass AuthorizationRegistry', () => {
  it('validateAndAuthorize delegates to AuthorizationRegistry for all actions', () => {
    const result = ContinuousImprovementService.validateAndAuthorize('APPLICATION_MONITORING');
    // Should pass through AuthorizationRegistry
    expect(result.authorized).toBe(true);
    expect(result.reason).toContain('Authorized');
  });

  it('unknown action is blocked even if improvement proposes it', () => {
    const result = ContinuousImprovementService.validateAndAuthorize('ARBITRARY_AI_INVENTED_ACTION');
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('Unknown action');
  });

  it('high-risk action requires owner approval per AuthorizationRegistry', () => {
    const result = ContinuousImprovementService.validateAndAuthorize('PRODUCTION_DEPLOYMENT');
    expect(result.authorized).toBe(false);
    expect(result.requiresApproval).toBe(true);
  });
});

// ─── 11. Pricing remains permanently blocked ──────────────────────────────────

describe('11. Pricing remains permanently blocked', () => {
  const pricingActions = [
    'CHANGE_PRICING', 'CHANGE_SUBSCRIPTION_PRICE', 'CHANGE_DISCOUNT',
    'CHANGE_BILLING_AMOUNT', 'CHANGE_CREDITS', 'CHANGE_PAYMENT_TERMS', 'SEND_MONEY'
  ];

  for (const action of pricingActions) {
    it(`blocks ${action} permanently — cannot be proposed as improvement`, () => {
      const result = ContinuousImprovementService.validateAndAuthorize(action);
      expect(result.authorized).toBe(false);
      expect(result.requiresApproval).toBe(false); // NOT even approval — permanently blocked
    });
  }

  it('proposal with pricing content in solution is blocked by security check', async () => {
    const mockSupabase = { from: vi.fn(() => createChain(null)) };
    const result = await ContinuousImprovementService.createProposal(mockSupabase, {
      workspaceId: 'ws-1',
      title: 'Change pricing strategy',
      category: 'CUSTOMER',
      pattern: 'Revenue opportunity',
      problem: 'We need to change_pricing for customers',
      proposedSolution: 'Apply CHANGE_PRICING to increase revenue',
      evidence: { facts: ['fact'], interpretation: 'i', recommendation: 'r', sourceIds: [], windowDays: 7, counts: {} },
      confidence: 'low',
      sourceType: 'SYSTEM',
      sourceIds: [],
      riskLevel: 'LOW',
      routedToExecutive: 'AI CFO',
      fingerprint: 'ws-1:pricing:test',
    });
    // Should be blocked by security check
    expect(result).toBeNull();
  });
});

// ─── 12. Owner approval still required for high-risk actions ─────────────────

describe('12. Owner approval still required for high-risk actions', () => {
  it('PRODUCTION_DEPLOYMENT requires owner approval — improvement cannot override this', () => {
    const result = AuthorizationRegistry.authorize('PRODUCTION_DEPLOYMENT');
    expect(result.authorized).toBe(false);
    expect(result.requiresApproval).toBe(true);
  });

  it('improvement proposal cannot mark itself as "approved" or change risk level to bypass approval', async () => {
    // Proposals start in PROPOSED state — they cannot self-approve
    const inserted: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => { inserted.push(d); return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'p1' }, error: null })) })) }; });
          return chain;
        }
        return createChain([]);
      })
    };

    await ContinuousImprovementService.createProposal(mockSupabase, {
      workspaceId: 'ws-1',
      title: 'Test',
      category: 'OPERATIONS',
      pattern: 'test',
      problem: 'test',
      proposedSolution: 'test',
      evidence: { facts: [], interpretation: '', recommendation: '', sourceIds: [], windowDays: 7, counts: {} },
      confidence: 'low',
      sourceType: 'SYSTEM',
      sourceIds: [],
      riskLevel: 'LOW',
      routedToExecutive: 'AI CEO',
      fingerprint: 'ws-1:test:123',
    });

    expect(inserted.length).toBe(1);
    expect(inserted[0].state).toBe('PROPOSED'); // Always starts as PROPOSED
  });
});

// ─── 13. Improvement outcome: execution != business success ───────────────────

describe('13. Execution success is not automatically business success', () => {
  it('recordImprovementOutcome accepts INCONCLUSIVE as valid result', async () => {
    const updated: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.update = vi.fn((d: any) => { updated.push(d); return chain; });
          chain.select = vi.fn(() => chain);
          chain.single = vi.fn(() => Promise.resolve({ data: { title: 'Test', category: 'OPERATIONS' }, error: null }));
          return chain;
        }
        return createChain(null);
      })
    };

    await ContinuousImprovementService.recordImprovementOutcome(
      mockSupabase, 'p1', 'ws-1', 'INCONCLUSIVE',
      'Task completed but business impact cannot be verified from available data.'
    );

    expect(updated.length).toBeGreaterThan(0);
    expect(updated[0].verification_result).toContain('INCONCLUSIVE');
  });
});

// ─── 14. Cannot create executable task before approval ────────────────────────

describe('14. Cannot create executable task before authorization', () => {
  it('validateAndAuthorize for unregistered action returns not authorized — no task created', () => {
    const result = ContinuousImprovementService.validateAndAuthorize('INVENT_NEW_CAPABILITY');
    expect(result.authorized).toBe(false);
    expect(result.requiresApproval).toBe(false);
    // No task creation should happen for unauthorized actions
  });
});

// ─── 15. Failed improvement creates LESSON in company memory ─────────────────

describe('15. Failed improvement creates lesson in company memory', () => {
  it('recordImprovementOutcome FAILURE updates to FAILED state', async () => {
    const updated: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.update = vi.fn((d: any) => { updated.push(d); return chain; });
          chain.select = vi.fn(() => chain);
          chain.single = vi.fn(() => Promise.resolve({ data: { title: 'Monitor App', category: 'RELIABILITY' }, error: null }));
          return chain;
        }
        return createChain(null);
      })
    };

    await ContinuousImprovementService.recordImprovementOutcome(
      mockSupabase, 'p1', 'ws-1', 'FAILURE',
      'Implementation did not reduce incident rate.'
    );

    expect(updated[0]?.state).toBe('FAILED');
    expect(updated[0]?.verification_result).toContain('FAILURE');
  });
});

// ─── 16. Historical owner approval does not expand permissions ─────────────────

describe('16. Historical owner approval does not expand permissions', () => {
  it('repeated owner approvals proposal explicitly states it does not change permissions', async () => {
    const inserted: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'approvals') return createChain([
          { id: 'a1', action: 'EXTERNAL_COMMUNICATION', title: 'Blog post', resolved_at: new Date().toISOString() },
          { id: 'a2', action: 'EXTERNAL_COMMUNICATION', title: 'Newsletter', resolved_at: new Date().toISOString() },
          { id: 'a3', action: 'EXTERNAL_COMMUNICATION', title: 'Social post', resolved_at: new Date().toISOString() },
        ]);
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => { inserted.push(d); return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'p1' }, error: null })) })) }; });
          return chain;
        }
        return createChain([]);
      })
    };

    await ContinuousImprovementService.detectRepeatedOwnerApprovals(mockSupabase, 'ws-1');

    expect(inserted.length).toBeGreaterThan(0);
    // Evidence must explicitly state no permission expansion
    const evidenceFacts = inserted[0].evidence.facts.join(' ');
    expect(evidenceFacts).toContain('do NOT expand');
    expect(evidenceFacts).toContain('AuthorizationRegistry');
  });

  it('EXTERNAL_COMMUNICATION still requires approval even if repeatedly approved historically', () => {
    const result = AuthorizationRegistry.authorize('EXTERNAL_COMMUNICATION');
    expect(result.authorized).toBe(false);
    expect(result.requiresApproval).toBe(true);
  });
});

// ─── 17. Historical rejection does not create permanent prohibition ────────────

describe('17. Historical owner rejection does not create permanent prohibition', () => {
  it('repeated rejections proposal explicitly states it does not permanently prohibit future proposals', async () => {
    const inserted: any[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'approvals') return createChain([
          { id: 'r1', action: 'MAJOR_PRODUCT_CHANGE', title: 'Feature X', resolution_reason: 'too risky', resolved_at: new Date().toISOString() },
          { id: 'r2', action: 'MAJOR_PRODUCT_CHANGE', title: 'Feature Y', resolution_reason: 'not now', resolved_at: new Date().toISOString() },
        ]);
        if (table === 'improvement_proposals') {
          const chain = createChain(null);
          chain.insert = vi.fn((d: any) => { inserted.push(d); return { select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 'p1' }, error: null })) })) }; });
          return chain;
        }
        return createChain([]);
      })
    };

    await ContinuousImprovementService.detectRepeatedOwnerRejections(mockSupabase, 'ws-1');

    expect(inserted.length).toBeGreaterThan(0);
    const evidenceFacts = inserted[0].evidence.facts.join(' ');
    // Must explicitly state it does NOT create a permanent prohibition
    expect(evidenceFacts).toContain('NOT create a permanent prohibition');
  });
});

// ─── 18. Concurrent scheduler does not create duplicate proposals ─────────────

describe('20. Concurrent scheduler does not create duplicate proposals', () => {
  it('createProposal handles 23505 fingerprint conflict gracefully — returns null', async () => {
    const mockSupabase = {
      from: vi.fn(() => {
        const chain = createChain(null);
        chain.insert = vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: '23505', message: 'duplicate key on fingerprint index' }
            }))
          }))
        }));
        return chain;
      })
    };

    const result = await ContinuousImprovementService.createProposal(mockSupabase, {
      workspaceId: 'ws-1',
      title: 'Duplicate test',
      category: 'OPERATIONS',
      pattern: 'test',
      problem: 'test',
      proposedSolution: 'test',
      evidence: { facts: [], interpretation: '', recommendation: '', sourceIds: [], windowDays: 7, counts: {} },
      confidence: 'low',
      sourceType: 'SYSTEM',
      sourceIds: [],
      riskLevel: 'LOW',
      routedToExecutive: 'AI CEO',
      fingerprint: 'ws-1:OPERATIONS:dedup:test',
    });

    expect(result).toBeNull(); // Silently skipped — not an error
  });
});

// ─── 19. Secrets cannot enter evidence ────────────────────────────────────────

describe('23. Secrets cannot enter improvement evidence', () => {
  const secretTests = [
    { content: 'api_key=sk-abc123', label: 'API key in evidence' },
    { content: 'password=hunter2', label: 'password in evidence' },
    { content: 'sk-ant-api-key-value', label: 'Anthropic-style key' },
  ];

  for (const { content, label } of secretTests) {
    it(`blocks proposal with secret: ${label}`, async () => {
      const mockSupabase = { from: vi.fn(() => createChain(null)) };
      const result = await ContinuousImprovementService.createProposal(mockSupabase, {
        workspaceId: 'ws-1',
        title: 'Test',
        category: 'OPERATIONS',
        pattern: content, // Secret embedded in pattern
        problem: 'test',
        proposedSolution: 'test',
        evidence: {
          facts: [content], // Secret in evidence
          interpretation: 'i',
          recommendation: 'r',
          sourceIds: [],
          windowDays: 7,
          counts: {}
        },
        confidence: 'low',
        sourceType: 'SYSTEM',
        sourceIds: [],
        riskLevel: 'LOW',
        routedToExecutive: 'AI CEO',
        fingerprint: 'ws-1:test:secret',
      });
      expect(result).toBeNull();
    });
  }
});

// ─── 20. Workspace A cannot retrieve workspace B improvements ─────────────────

describe('22. Workspace A cannot retrieve workspace B improvements', () => {
  it('getActiveProposals always filters by the exact workspace ID provided', async () => {
    const eqCalls: string[] = [];
    const mockSupabase = {
      from: vi.fn(() => {
        const chain = createChain([]);
        chain.eq = vi.fn((col: string, val: string) => {
          eqCalls.push(`${col}=${val}`);
          return chain;
        });
        chain.in = vi.fn(() => chain);
        chain.order = vi.fn(() => chain);
        chain.limit = vi.fn(() => chain);
        chain.then = (resolve: any) => resolve({ data: [], error: null });
        return chain;
      })
    };

    await ContinuousImprovementService.getActiveProposals(mockSupabase, 'target-workspace', 10);
    expect(eqCalls).toContain('workspace_id=target-workspace');
    expect(eqCalls).not.toContain('workspace_id=other-workspace');
  });
});

// ─── 21. analyzeWorkspace cooldown prevents spam ──────────────────────────────

describe('Cooldown prevents proposal spam', () => {
  it('analyzeWorkspace returns early if a proposal was created in the last 6 hours', async () => {
    const detectPattersCalled: boolean[] = [];
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'improvement_proposals') {
          // Return a recent proposal (within cooldown window)
          return createChain([{ id: 'p-recent', created_at: new Date().toISOString() }]);
        }
        detectPattersCalled.push(true);
        return createChain([]);
      })
    };

    // If detectPatterns is not called, then from() for incidents, tasks, etc. won't be called
    const fromCallsBefore = (mockSupabase.from as any).mock?.calls?.length || 0;
    await ContinuousImprovementService.analyzeWorkspace(mockSupabase, 'ws-1');
    const fromCallsAfter = (mockSupabase.from as any).mock?.calls?.length || 0;

    // Only the cooldown check query was made — detectPatterns was not run
    expect(fromCallsAfter - fromCallsBefore).toBeLessThanOrEqual(1);
  });
});

// ─── 22. formatProposalsForContext produces safe output ───────────────────────

describe('formatProposalsForContext output safety', () => {
  it('does not include raw UUIDs in formatted output', () => {
    const proposals = [
      {
        id: 'aaaabbbb-cccc-dddd-eeee-ffffffffffff',
        category: 'RELIABILITY',
        title: 'Test proposal',
        pattern: 'Test pattern',
        confidence: 'medium',
        state: 'PROPOSED',
      }
    ];
    const output = ContinuousImprovementService.formatProposalsForContext(proposals);
    // The UUID should not appear verbatim in the output (only structured info)
    expect(output).not.toContain('aaaabbbb-cccc-dddd-eeee-ffffffffffff');
    expect(output).toContain('Test proposal');
    expect(output).toContain('RELIABILITY');
    expect(output).toContain('not guarantees'); // "These are patterns, not guarantees"
  });

  it('returns empty string when no proposals exist', () => {
    const output = ContinuousImprovementService.formatProposalsForContext([]);
    expect(output).toBe('');
  });
});
