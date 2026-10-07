const fs = require('fs');
const content = fs.readFileSync('backend/src/api/agents.ts', 'utf8');
const lines = content.split('\n');
let start = lines.findIndex(l => l.includes("router.post('/:id/chat'"));
console.log(lines.slice(start, start + 80).join('\n'));
