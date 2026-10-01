const fs = require('fs');
let file = 'backend/src/api/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    "import commandCenterRouter from './commandCenter';",
    "import commandCenterRouter from './commandCenter';\nimport chatRouter from './chat';"
);
content = content.replace(
    "router.use('/workspaces/:workspaceId/command-center', commandCenterRouter);",
    "router.use('/workspaces/:workspaceId/command-center', commandCenterRouter);\nrouter.use('/workspaces/:workspaceId/chat', chatRouter);"
);
fs.writeFileSync(file, content);
