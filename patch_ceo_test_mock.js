const fs = require('fs');
let code = fs.readFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', 'utf8');

const targetMock = `    mockSupabase.from = vi.fn((table: string) => {
      const createChain = (data: any) => {
        const chain: any = {
          select: vi.fn(() => chain), eq: vi.fn(() => chain), in: vi.fn(() => chain), order: vi.fn(() => chain), limit: vi.fn(() => chain), update: vi.fn((args: any) => { updateCalls.push(args); return chain; }), insert: vi.fn((args: any) => { insertCalls.push(args); return chain; }), single: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })), then: (resolve: any) => resolve({ data, error: null })
        };
        return chain;
      };
      if (table === 'workspaces') return createChain({ id: 'ws1', status: 'operating' });
      if (table === 'business_missions') return createChain([mission]);
      if (table === 'tasks') return createChain(tasks);
      if (table === 'mission_results') return createChain(results);
      if (table === 'approvals') return createChain(approvals);
      if (table === 'mission_plans') return createChain([{id: 'p1', status: 'ACTIVE'}]);
      if (table === 'mission_plan_steps') return createChain([{id: 's1', step_type: 'LEAD_RESEARCH', authorization_class: 'LEAD_RESEARCH', status: 'PENDING'}]);
      if (table === 'incidents') return createChain([]);
      return createChain([]);
    });`;

const replacementMock = `    mockSupabase.from = vi.fn((table: string) => {
      const createChain = (data: any) => {
        const chain: any = {
          select: vi.fn(() => chain), eq: vi.fn(() => chain), in: vi.fn(() => chain), order: vi.fn(() => chain), limit: vi.fn(() => chain), update: vi.fn((args: any) => { updateCalls.push(args); return chain; }), insert: vi.fn((args: any) => { insertCalls.push(args); return chain; }), single: vi.fn(async () => ({ data: Array.isArray(data) ? data[0] : data, error: null })), then: (resolve: any) => resolve({ data, error: null })
        };
        return chain;
      };
      
      let stepStatus = 'PENDING';
      if (tasks && tasks.length > 0) {
         if (tasks.some(t => t.status === 'RUNNING')) stepStatus = 'RUNNING';
         else if (tasks.some(t => t.status === 'FAILED')) stepStatus = 'FAILED';
         else if (tasks.some(t => t.status === 'BLOCKED')) stepStatus = 'BLOCKED';
         else if (tasks.some(t => t.status === 'PENDING' || t.status === 'ASSIGNED')) stepStatus = 'RUNNING'; // Already spawned
      }
      
      if (table === 'workspaces') return createChain({ id: 'ws1', status: 'operating' });
      if (table === 'business_missions') return createChain([mission]);
      if (table === 'tasks') return createChain(tasks);
      if (table === 'mission_results') return createChain(results);
      if (table === 'approvals') return createChain(approvals);
      if (table === 'mission_plans') return createChain([{id: 'p1', status: 'ACTIVE'}]);
      if (table === 'mission_plan_steps') return createChain([{id: 's1', step_type: 'LEAD_RESEARCH', authorization_class: 'LEAD_RESEARCH', status: stepStatus}]);
      if (table === 'incidents') return createChain([]);
      return createChain([]);
    });`;

if (code.includes(targetMock)) {
  code = code.replace(targetMock, replacementMock);
  fs.writeFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', code);
  console.log('Fixed setupState mock successfully');
} else {
  const t2 = targetMock.replace(/\n/g, '\r\n');
  const r2 = replacementMock.replace(/\n/g, '\r\n');
  if (code.includes(t2)) {
    code = code.replace(t2, r2);
    fs.writeFileSync('backend/src/tests/ceoMissionOrchestration.test.ts', code);
    console.log('Fixed setupState mock successfully');
  } else {
    console.log('Target string not found');
  }
}
