const fs = require('fs');
let file = 'backend/src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '    const payload = {\n      companyStatus,\n      goals: businessGoals || [],',
  '    const payload = {\n      companyStatus,\n      health: {\n        operations: opsHealth,\n        technology: techHealth,\n        finance: finHealth,\n        customers: custHealth,\n        workforce: workforceHealth\n      },\n      goals: businessGoals || [],'
);

// Also fix decisionTimeline in Dashboard
let fileDash = 'frontend/src/pages/Dashboard.tsx';
let dashContent = fs.readFileSync(fileDash, 'utf8');
dashContent = dashContent.replace('d.title', 'd.action || d.reason');
dashContent = dashContent.replace('d.description', 'd.outcome');
fs.writeFileSync(fileDash, dashContent);

fs.writeFileSync(file, content);
