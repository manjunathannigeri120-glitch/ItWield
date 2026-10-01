const fs = require('fs');
let file = 'frontend/src/pages/Approvals.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "await api.post(`/workspaces/${currentWorkspace.id}/approvals/${approvalId}/approve`, payload);",
  "setApprovals(prev => prev.filter(a => a.id !== approvalId));\n      await api.post(`/workspaces/${currentWorkspace.id}/approvals/${approvalId}/approve`, payload);"
);
content = content.replace(
  "await api.post(`/workspaces/${currentWorkspace.id}/approvals/${approvalId}/reject`);",
  "setApprovals(prev => prev.filter(a => a.id !== approvalId));\n      await api.post(`/workspaces/${currentWorkspace.id}/approvals/${approvalId}/reject`);"
);

fs.writeFileSync(file, content);
console.log('Fixed Approvals optimistic UI');
