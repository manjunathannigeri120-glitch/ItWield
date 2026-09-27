const fs = require('fs');
const file = 'backend/src/tests/MissionProgressService.test.ts';
let code = fs.readFileSync(file, 'utf8');

const test = `
  test('Blocked tasks are treated as mostRecentErrorTask and surface a blocker', async () => {
    setupMockData(
      { status: 'ACTIVE', type: 'GET_CUSTOMERS', target_count: 25 },
      [ { id: 't1', status: 'BLOCKED', error: 'No executable capability configured.', updated_at: new Date().toISOString() } ],
      []
    );
    const res = await MissionProgressService.calculateProgress(mockSupabase as any, 'ws1', 'm1');
    expect(res.work.blocked).toBe(1);
    expect(res.blocker).not.toBeNull();
    expect(res.blocker?.type).toBe('TASK_FAILURE');
    expect(res.nextAction).toBe('Resolve blocker to continue.');
  });
});
`;

code = code.replace(/\}\);\s*$/, test);
fs.writeFileSync(file, code);
console.log('Appended test');
