const fs = require('fs');
const file = 'backend/src/tests/commandCenter.test.ts';
let c = fs.readFileSync(file, 'utf8');

const replacement = `mockSupabase.from.mockImplementation((table: string) => {
      const createChain = (data: any) => {
        const chain: any = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          neq: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          single: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })),
          then: (resolve: any) => resolve({ data, error: null })
        };
        return chain;
      };

      if (table === 'workspaces') return createChain({ id: 'ws-1', name: 'Test WS', company_goals: 'acquire customers' });
      if (table === 'incidents') return createChain([{ type: 'application_health', status: 'ACTIVE', severity: 'high', created_at: new Date().toISOString(), title: 'Error' }]);
      if (table === 'management_items') return createChain([{ type: 'TECHNOLOGY', priority: 'HIGH', title: 'Tech Error', status: 'ACTIVE' }]);
      if (table === 'pending_approvals') return createChain([{ id: '1' }]);
      if (table === 'agents') return createChain([{ id: 'a1', name: 'AI CEO', role: 'CEO', status: 'idle' }]);
      if (table === 'tasks') return createChain([{ assigned_agent_id: 'a1', status: 'RUNNING', error: 'fail' }]);
      if (table === 'connections') return createChain([]);
      if (table === 'business_missions') return createChain([{ id: 'm1', status: 'ACTIVE', progress: 50 }]);
      if (table === 'opportunities') return createChain([{ id: 'o1', stage: 'QUALIFIED', value: 1000 }]);
      if (table === 'ceo_decisions') return createChain([{ id: 'd1', decision: 'Wait', created_at: new Date().toISOString() }]);
      if (table === 'mission_events') return createChain([{ id: 'me1', event_type: 'MILESTONE', created_at: new Date().toISOString() }]);
      if (table === 'company_memory') return createChain([{ memory_type: 'DECISION' }]);
      
      return createChain([]);
    });`;

c = c.replace(/mockSupabase\.from\.mockImplementation\(\(table: string\) => \{[\s\S]*?return createChain\(\[\]\);\n    \}\);/, replacement);

fs.writeFileSync(file, c);
console.log('patched commandCenter test');
