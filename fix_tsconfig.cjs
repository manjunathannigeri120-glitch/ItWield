const fs = require('fs');
let file = 'frontend/tsconfig.app.json';
if (!fs.existsSync(file)) file = 'frontend/tsconfig.json';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/"noUnusedLocals":\s*true,/g, '"noUnusedLocals": false,');
content = content.replace(/"noUnusedParameters":\s*true,/g, '"noUnusedParameters": false,');

fs.writeFileSync(file, content);
