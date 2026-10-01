const fs = require('fs');
let file = 'src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add COO to executives
let cooCode = `        {
          id: aiCoo?.id, role: 'COO',
          name: aiCoo?.name || 'AI COO',
          focus: opsHealth !== 'HEALTHY' ? 'Coordinating operations' : 'Overseeing workforce',
          blockers: pendingApprovals.length > 0 ? 'Awaiting Founder Approval' : 'None',
          latestDecision: 'Task delegation'
        },`;

// Find the CFO entry and insert COO before it
content = content.replace(
  '{\n          id: aiCfo?.id, role: \'CFO\',',
  cooCode + '\n        {\n          id: aiCfo?.id, role: \'CFO\','
);

// 2. Add health to the payload root
content = content.replace(
  'companyStatus,',
  'companyStatus,\n        health: companyStatus.health,'
);

fs.writeFileSync(file, content);
