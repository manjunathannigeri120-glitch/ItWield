const fs = require('fs');
let file = 'backend/src/api/cto.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'const { data: incidents } = await db.from(\'incidents\').select(\'*\').eq(\'workspace_id\', workspaceId).order(\'created_at\', { ascending: false }).limit(20);',
  'let incidents = []; try { const res = await db.from(\'incidents\').select(\'*\').eq(\'workspace_id\', workspaceId).order(\'created_at\', { ascending: false }).limit(20); incidents = res.data || []; } catch(e) {}'
);

fs.writeFileSync(file, content);
