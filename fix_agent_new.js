const fs = require('fs');
let agentNew = fs.readFileSync('frontend/src/pages/AgentNew.tsx', 'utf8');
agentNew = agentNew.replace(/model: 'gpt-4o-mini',/g, "model: 'apodex/apodex-1.1-mini:free',");
fs.writeFileSync('frontend/src/pages/AgentNew.tsx', agentNew);
