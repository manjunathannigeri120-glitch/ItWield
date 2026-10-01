const fs = require('fs');
let file = 'frontend/src/pages/CTO.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "setTimeout(() => setRunningDiagnostic(false), 2000);",
  "setTimeout(() => { setRunningDiagnostic(false); loadData(); }, 2000);"
);

fs.writeFileSync(file, content);
console.log('Fixed CTO.tsx');
