const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// I'll add an optimistic hide state to Dashboard just in case
content = content.replace(
  "const handleApprove = async (approvalId: string) => {",
  "const [hiddenApprovals, setHiddenApprovals] = useState<string[]>([]);\n  const handleApprove = async (approvalId: string) => {\n    setHiddenApprovals(prev => [...prev, approvalId]);"
);

content = content.replace(
  "const pendingApprovals = (ccData?.approvals || []).filter((a: any) => a.status === 'PENDING' || a.status === 'PENDING_APPROVAL');",
  "const pendingApprovals = (ccData?.approvals || []).filter((a: any) => (a.status === 'PENDING' || a.status === 'PENDING_APPROVAL') && !hiddenApprovals.includes(a.id));"
);

fs.writeFileSync(file, content);
console.log('Fixed Dashboard optimistic UI');
