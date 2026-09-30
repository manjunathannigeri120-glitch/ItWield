const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'CEOService.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /await COOService\.operate\(supabase, workspaceId\);/g,
    `await COOService.operate(supabase, workspaceId, nextContext);`
);

fs.writeFileSync(file, content);
