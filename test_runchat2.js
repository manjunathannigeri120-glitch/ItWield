const fs = require('fs');
const content = fs.readFileSync('backend/src/agents/runtime.ts', 'utf8');
const lines = content.split('\n');
let start = lines.findIndex(l => l.includes("const aiProvider = this.getProvider()"));
console.log(lines.slice(start, start + 80).join('\n'));
