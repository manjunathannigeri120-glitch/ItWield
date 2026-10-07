import re

with open('backend/src/api/agents.ts', 'r', encoding='utf-8') as f:
    data = f.read()

data = data.replace(
    "const creditCheck = await CreditService.deductCredits(req.supabase, agent.workspace_id || req.user?.workspace_id, 1);",
    "const creditCheck = await CreditService.deductCredits(req.supabase, agent.workspace_id, 1);"
)

with open('backend/src/api/agents.ts', 'w', encoding='utf-8') as f:
    f.write(data)
