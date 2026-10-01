const fs = require('fs');
let file = 'frontend/src/pages/Approvals.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "await api.post(`/workspaces/${currentWorkspace.id}/approvals/${approvalId}/approve`, payload);",
  "await api.post(`/workspaces/${currentWorkspace.id}/approvals/${approvalId}/approve`, payload); alert('Approval successfully executed!');"
);

content = content.replace(
  "await api.post(`/workspaces/${currentWorkspace.id}/approvals/${approvalId}/reject`);",
  "await api.post(`/workspaces/${currentWorkspace.id}/approvals/${approvalId}/reject`); alert('Request successfully rejected.');"
);

fs.writeFileSync(file, content);
console.log('Added success alerts');
