const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('typeof data.credits === \'number\' ? data.credits : 200', 'typeof data.credits === \'number\' ? data.credits : 150');
fs.writeFileSync(file, content);
console.log('Fixed fallback credits in workspaces.ts');
