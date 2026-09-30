const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "await CompanyMemoryService.createMemory(req.supabase, workspaceId, memoryParams);",
  "const { createClient } = require('@supabase/supabase-js');\n      const supabaseAdmin = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);\n      await CompanyMemoryService.createMemory(supabaseAdmin, workspaceId, memoryParams);"
);

fs.writeFileSync(file, content);
