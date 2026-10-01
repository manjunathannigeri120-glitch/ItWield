const fs = require('fs');
let file = 'src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');

let cooCode = `id: aiCoo?.id, role: 'COO',
          name: aiCoo?.name || 'AI COO',
          focus: opsHealth !== 'HEALTHY' ? 'Coordinating operations' : 'Overseeing workforce',
          blockers: pendingApprovals.length > 0 ? 'Awaiting Founder Approval' : 'None',
          latestDecision: 'Task delegation'
        },
        {
          id: aiCfo?.id, role: 'CFO',`;

content = content.replace(
  'id: aiCfo?.id, role: \'CFO\',',
  cooCode
);

fs.writeFileSync(file, content);
