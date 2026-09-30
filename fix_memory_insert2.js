const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "createdBy: req.user?.id || 'SYSTEM'\n      }, req.supabase).catch",
  "createdBy: req.user?.id || 'SYSTEM'\n      }, require('@supabase/supabase-js').createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)).catch"
);

fs.writeFileSync(file, content);
