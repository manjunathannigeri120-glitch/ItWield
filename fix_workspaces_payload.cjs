const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    "if (updated.action === 'EXTERNAL_COMMUNICATION' && updated.payload && updated.payload.opportunity_id) {",
    "if (updated.action === 'EXTERNAL_COMMUNICATION' && updated.payload && (updated.payload.opportunity_id || updated.payload.oppId)) {"
);

content = content.replace(
    "const oppId = updated.payload.opportunity_id;",
    "const oppId = updated.payload.opportunity_id || updated.payload.oppId;"
);

fs.writeFileSync(file, content);
console.log('Fixed workspaces.ts payload extraction');
