const fs = require('fs');
const path = 'backend/src/api/agents.ts';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "import { z } from 'zod';",
  "import { z } from 'zod';\nimport { EntitlementService } from '../services/EntitlementService';"
);

c = c.replace(
  "const { tools, knowledge_bases, ...agentData } = validatedData;",
  \
    const limitCheck = await EntitlementService.checkWorkerLimit(req.supabase, workspaceId);
    if (!limitCheck.allowed) {
      return res.status(403).json({ error: 'PLAN_LIMIT_REACHED', details: \\\Your plan (SOLO_BUILDER) is limited to \\\ AI workers.\\\ });
    }

    const { tools, knowledge_bases, ...agentData } = validatedData;\
);

fs.writeFileSync(path, c);
console.log('patched agents.ts');
