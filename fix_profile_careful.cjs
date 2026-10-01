const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `const { data, error } = await req.supabase
      .from('workspaces')
      .insert({
        owner_id: req.user?.id,
        name: validatedData.name
      })`;

const fix = `
      // Ensure user has a profile to satisfy foreign key constraints
      if (req.user?.id) {
        try {
          await req.supabase.from('profiles').upsert({ id: req.user.id, email: req.user.email || '' }, { onConflict: 'id' });
        } catch (e) { console.error('Profile upsert failed:', e); }
      }

      ` + target;

content = content.replace(target, fix);

fs.writeFileSync(file, content);
console.log('Injected profile upsert correctly');
