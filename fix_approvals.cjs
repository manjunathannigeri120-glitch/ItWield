const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "const pendingApprovals = ccData?.approvals || [];",
  "const pendingApprovals = (ccData?.approvals || []).filter((a: any) => a.status === 'PENDING' || a.status === 'PENDING_APPROVAL');"
);

fs.writeFileSync(file, content);
console.log('Fixed pending approvals bug');
