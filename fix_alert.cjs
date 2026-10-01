const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'alert("Failed to approve");',
  'alert("Failed to approve: " + (e.response?.data?.error || e.message));'
);
fs.writeFileSync(file, content);
