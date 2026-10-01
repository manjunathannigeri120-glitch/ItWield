const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'alert("Failed to approve: " + (e.response?.data?.error || e.message));',
  'alert("Failed to approve: " + ((e as any).response?.data?.error || (e as any).message));'
);
fs.writeFileSync(file, content);
