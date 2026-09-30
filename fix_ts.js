const fs = require('fs');
let file2 = 'frontend/src/pages/Dashboard.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace('const [nextAction, setNextAction]', 'const [_nextAction, setNextAction]');
fs.writeFileSync(file2, content2);
