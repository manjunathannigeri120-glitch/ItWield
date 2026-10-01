const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /await req\.supabase[\s\S]*?\.catch\(e => console\.error\('Profile upsert failed:', e\)\);/,
  `try { await req.supabase.from('profiles').upsert({ id: req.user?.id, email: req.user?.email }, { onConflict: 'id' }); } catch(e) {}`
);

fs.writeFileSync(file, content);
console.log('Fixed profile upsert syntax');
