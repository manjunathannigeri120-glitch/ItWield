const fs = require('fs');
let file = 'frontend/src/pages/Approvals.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "alert('Failed to approve');",
  "alert('Failed to approve: ' + ((e as any).response?.data?.error || (e as any).message));"
);
content = content.replace(
  "alert('Failed to reject');",
  "alert('Failed to reject: ' + ((e as any).response?.data?.error || (e as any).message));"
);

fs.writeFileSync(file, content);
console.log('Fixed error alerts');
