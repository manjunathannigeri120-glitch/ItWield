const fs = require('fs');

// Fix ceoRouting
let path = 'backend/src/tests/ceoRouting.test.ts';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(
  /in: vi\.fn\(\)\.mockReturnThis\(\),/g,
  "in: vi.fn().mockReturnThis(),\n          single: vi.fn().mockResolvedValue({ data: { id: 'cmo', capabilities: ['LEAD_RESEARCH'] } }),"
);
fs.writeFileSync(path, c);

// Fix ceoGoalAction
path = 'backend/src/tests/ceoGoalAction.test.ts';
c = fs.readFileSync(path, 'utf8');
c = c.replace(
  /\{ id: 'cmo-1', name: 'AI CMO', workspace_id: 'ws-1' \}/g,
  "{ id: 'cmo-1', name: 'AI CMO', workspace_id: 'ws-1', capabilities: ['COMPETITIVE_ANALYSIS'] }"
);
fs.writeFileSync(path, c);

// Fix commandCenter
path = 'backend/src/tests/commandCenter.test.ts';
c = fs.readFileSync(path, 'utf8');
c = c.replace(
  /status: 'RUNNING', error: 'fail'/g,
  "status: 'FAILED', error: 'fail'"
);
fs.writeFileSync(path, c);

console.log('patched direct');
