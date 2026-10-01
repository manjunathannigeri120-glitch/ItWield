const fs = require('fs');
let file = 'backend/src/api/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    "import companyRouter from './company';",
    "import companyRouter from './company';\nimport chatRouter from './chat';"
);
content = content.replace(
    "router.use('/workspaces', workspaceRoutes);",
    "router.use('/workspaces', workspaceRoutes);\nrouter.use('/workspaces/:workspaceId/chat', chatRouter);"
);
fs.writeFileSync(file, content);
console.log('Fixed api/index.ts for real');
