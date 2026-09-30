const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\/\/ 1\. Mark as operating[\s\S]*?\/\/ 2\. Inject V2 Executive Layer \+ Workers/, 
  "// 1. Mark as operating\n    const { error: wsUpdateErr } = await req.supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);\n    if (wsUpdateErr) throw wsUpdateErr;\n\n    // 2. Inject V2 Executive Layer + Workers"
);

fs.writeFileSync(file, content);
