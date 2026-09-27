import re

path = 'backend/src/api/agents.ts'
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
  "import { z } from 'zod';",
  "import { z } from 'zod';\nimport { EntitlementService } from '../services/EntitlementService';"
)

c = c.replace(
  "const { tools, knowledge_bases, ...agentData } = validatedData;",
  """
      const limitCheck = await EntitlementService.checkWorkerLimit(req.supabase, workspaceId);
      if (!limitCheck.allowed) {
        return res.status(403).json({ error: 'PLAN_LIMIT_REACHED', details: `Your plan is limited to ${limitCheck.limit} AI workers.` });
      }

      const { tools, knowledge_bases, ...agentData } = validatedData;"""
)

with open(path, 'w') as f:
    f.write(c)

print('patched agents.ts')
