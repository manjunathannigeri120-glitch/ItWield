const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

const target = "const { data, error } = await req.supabase";
const fix = `
      // Ensure user has a profile to satisfy foreign key constraints
      if (req.user?.id) {
        try {
          await req.supabase.from('profiles').upsert({ id: req.user.id, email: req.user.email || '' }, { onConflict: 'id' });
        } catch (e) { console.error('Profile upsert failed:', e); }
      }

      ` + target;

// Only replace the FIRST occurrence in POST /workspaces!
content = content.replace(
  /const validatedData = WorkspaceSchema\.parse\(req\.body\);[\s\S]*?const \{ data, error \} = await req\.supabase/,
  (match) => match.replace("const { data, error } = await req.supabase", fix)
);

fs.writeFileSync(file, content);
console.log('Injected safely');
