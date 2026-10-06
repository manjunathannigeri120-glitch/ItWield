const fs = require('fs');
let runtime = fs.readFileSync('backend/src/agents/runtime.ts', 'utf8');
runtime = runtime.replace(/throw new Error\('Agent execution failed'\);/g, "throw new Error(error.message || 'Agent execution failed');");
fs.writeFileSync('backend/src/agents/runtime.ts', runtime);
