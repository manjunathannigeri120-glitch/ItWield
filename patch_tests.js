const fs = require('fs');

const fixCreateChain = (file) => {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(
    /single: vi\.fn\(\(\) => Promise\.resolve\(\{ data: insertedData, error \}\)\),/g,
    `single: vi.fn(() => Promise.resolve({ data: Array.isArray(insertedData) ? insertedData[0] : insertedData, error })),`
  );
  
  // also inject missing capabilities into agents
  c = c.replace(
    /\{ id: 'cto-1', name: 'AI CTO', workspace_id: 'ws-1' \}/g,
    `{ id: 'cto-1', name: 'AI CTO', workspace_id: 'ws-1', capabilities: ['APPLICATION_MONITORING'] }`
  );
  
  c = c.replace(
    /\{ id: 'mon-1', name: 'Application Monitor', workspace_id: 'ws-1' \}/g,
    `{ id: 'mon-1', name: 'Application Monitor', workspace_id: 'ws-1', capabilities: ['APPLICATION_MONITORING'] }`
  );
  
  c = c.replace(
    /\{ id: 'cmo-1', name: 'AI CMO', workspace_id: 'ws-1' \}/g,
    `{ id: 'cmo-1', name: 'AI CMO', workspace_id: 'ws-1', capabilities: ['COMPETITIVE_ANALYSIS', 'LEAD_RESEARCH'] }`
  );

  fs.writeFileSync(file, c);
};

['backend/src/tests/ceo.test.ts', 'backend/src/tests/ceoGoalAction.test.ts', 'backend/src/tests/ceoAuthorizationExecution.test.ts', 'backend/src/tests/ceoRouting.test.ts'].forEach(fixCreateChain);
console.log('patched tests');
