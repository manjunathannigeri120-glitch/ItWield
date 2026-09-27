const fs = require('fs');
let code = fs.readFileSync('backend/src/workflows/workflowGenerator.ts', 'utf8');
code = code.replace(/rawContent = response\.choices\[0\]\?\.message\?\.content \|\| '';/g, "rawContent = response.text || '';");
fs.writeFileSync('backend/src/workflows/workflowGenerator.ts', code);
console.log('Fixed TS error');
