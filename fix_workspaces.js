const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "// 1. Mark as operating",
  "// 1. Mark as operating\n    const { error: updateErr } = await req.supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);\n    if (updateErr) throw updateErr;\n"
);

fs.writeFileSync(file, content);
