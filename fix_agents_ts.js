const fs = require('fs');
let agentsTs = fs.readFileSync('backend/src/api/agents.ts', 'utf8');
agentsTs = agentsTs.replace(/model: z\.string\(\)\.default\('mock-model-v1'\)/g, "model: z.string().default('apodex/apodex-1.1-mini:free')");
fs.writeFileSync('backend/src/api/agents.ts', agentsTs);
