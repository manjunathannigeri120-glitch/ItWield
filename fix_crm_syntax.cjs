const fs = require('fs');
let file = 'frontend/src/pages/CRM.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\{\/\* Qualification \*\//g, '{/* Qualification */}');
fs.writeFileSync(file, content);
