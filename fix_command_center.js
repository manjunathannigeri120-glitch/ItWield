import fs from 'fs';
let file = 'backend/src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "const pendingApprovals = approvals.filter((a: any) => a.status === 'PENDING');",
  "const pendingApprovals = approvals.filter((a: any) => a.status === 'PENDING' || a.status === 'PENDING_APPROVAL');"
);
fs.writeFileSync(file, content);
