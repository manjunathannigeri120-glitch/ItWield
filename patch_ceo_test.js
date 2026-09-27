const fs = require('fs');
let code = fs.readFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', 'utf8');

const testStr = `  test('Prioritizes ready step execution even if an old task failure generated a blocker', async () => {
    // 1. Mission is ACTIVE
    // 2. An old task exists and is BLOCKED (generating progress.blocker)
    // 3. The mission plan has a READY step
    setupState(
      { id: 'm1', status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [ { id: 't1', status: 'BLOCKED', error: 'No executable capability configured.', updated_at: new Date().toISOString() } ],
      []
    );
    // Override the plan mock to return a READY step
    mockSupabase.from = vi.fn((table: string) => {
      const createChain = (data: any) => {
        const chain: any = {
          select: vi.fn(() => chain), eq: vi.fn(() => chain), in: vi.fn(() => chain), order: vi.fn(() => chain), limit: vi.fn(() => chain), update: vi.fn((args: any) => { updateCalls.push(args); return chain; }), insert: vi.fn((args: any) => { insertCalls.push(args); return chain; }), single: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })), then: (resolve: any) => resolve({ data, error: null })
        };
        return chain;
      };
      if (table === 'workspaces') return createChain({ id: 'ws1', status: 'operating' });
      if (table === 'business_missions') return createChain([{id: 'm1', status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25}]);
      if (table === 'tasks') return createChain([{ id: 't1', status: 'BLOCKED', error: 'No executable capability configured.', updated_at: new Date().toISOString() }]);
      if (table === 'mission_results') return createChain([]);
      if (table === 'approvals') return createChain([]);
      if (table === 'mission_plans') return createChain([{id: 'p1', status: 'ACTIVE'}]);
      if (table === 'mission_plan_steps') return createChain([{id: 's1', step_type: 'LEAD_RESEARCH', authorization_class: 'LEAD_RESEARCH', status: 'READY'}]);
      if (table === 'incidents') return createChain([]);
      return createChain([]);
    });

    await CEOService.observeWorkspace(mockSupabase as any, 'ws1');

    // CEOService.run should be called to execute the READY step, despite the blocked task!
    expect(runCalls.length).toBe(1);
    expect(runCalls[0][2]).toBe('SCHEDULED_OBSERVATION:LEAD_RESEARCH');
  });

});`;

code = code.replace(/\}\);\s*$/g, testStr);
fs.writeFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', code);
console.log('Appended test successfully');
