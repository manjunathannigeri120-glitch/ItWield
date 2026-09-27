const fs = require('fs');
let path = 'backend/src/api/index.ts';
let c = fs.readFileSync(path, 'utf8');

if (!c.includes('import goalsRouter')) {
  c = c.replace(
    "import workspacesRouter from './workspaces';", 
    "import workspacesRouter from './workspaces';\nimport goalsRouter from './goals';"
  );
  c = c.replace(
    "router.use('/workspaces', workspacesRouter);",
    "router.use('/workspaces', workspacesRouter);\nrouter.use('/workspaces/:workspaceId/goals', goalsRouter);"
  );
  fs.writeFileSync(path, c);
}
console.log('patched api index');
