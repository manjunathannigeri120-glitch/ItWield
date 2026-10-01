const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

const fix = `// Ensure user has a profile to satisfy foreign key constraints for older or manually altered accounts
      await req.supabase
        .from('profiles')
        .upsert({ id: req.user?.id, email: req.user?.email }, { onConflict: 'id' })
        .catch(e => console.error('Profile upsert failed:', e));

      const { data, error } = await req.supabase`;

content = content.replace(
  /const \{ data, error \} = await req\.supabase\s*\.from\('workspaces'\)\s*\.insert\(\{/,
  fix + "\n        .from('workspaces')\n        .insert({"
);

fs.writeFileSync(file, content);
console.log('Injected profile fix');
