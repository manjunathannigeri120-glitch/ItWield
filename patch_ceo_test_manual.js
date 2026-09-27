const fs = require('fs');
let code = fs.readFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', 'utf8');

const regex = /const setupState = \([\s\S]*?return createChain\(\[\]\);\s*\}\);\s*\};\s*/m;

const replacement = `const setupState = (mission: any, tasks: any[], results: any[], approvals: any[] = []) => {
    mockSupabase.from = vi.fn((table: string) => {
      const createChain = (data: any) => {
        const chain: any = {
           select: vi.fn(() => chain), eq: vi.fn(() => chain), neq: vi.fn(() => chain), in: vi.fn(() => chain),
           single: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })),
           order: vi.fn(() => chain), limit: vi.fn(() => chain),
           update: vi.fn((args: any) => { updateCalls.push({table, args}); return chain; }),
           insert: vi.fn((args: any) => { insertCalls.push({table, args}); return chain; }),
           then: (resolve: any) => resolve({ data, error: null })
        };
        return chain;
      };

      if (table === 'workspaces') return createChain([{ id: 'ws1', status: 'operating' }]);
      if (table === 'business_missions') return createChain([mission]);
      if (table === 'tasks') return createChain(tasks);
      if (table === 'mission_results') return createChain(results);
      if (table === 'approvals') return createChain(approvals);
      if (table === 'mission_plans') return createChain([{id: 'p1', status: 'ACTIVE'}]);
      
      let stepStatus = 'PENDING';
      if (tasks && tasks.length > 0) {
          if (tasks.some(t => ['RUNNING', 'PENDING', 'ASSIGNED'].includes(t.status))) stepStatus = 'RUNNING';
          else if (tasks.some(t => t.status === 'FAILED')) stepStatus = 'FAILED';
          else if (tasks.some(t => t.status === 'BLOCKED')) stepStatus = 'BLOCKED';
      }
      
      if (table === 'mission_plan_steps') return createChain([{id: 's1', step_type: 'LEAD_RESEARCH', authorization_class: 'LEAD_RESEARCH', status: stepStatus}]);
      return createChain([]);
    });
  };
`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', code);
  console.log('Fixed setupState manually');
} else {
  console.log('Regex did not match');
}
