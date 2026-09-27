const fs = require('fs');
const file = 'backend/src/api/commandCenter.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  "import { requireAuth } from '../middleware/auth';",
  "import { requireAuth } from '../middleware/auth';\nimport { WorkforceIntegrityService } from '../services/WorkforceIntegrityService';"
);

c = c.replace(
  /\/\/ --- 10\. WORKFORCE ---[\s\S]*?\}\);/,
  `// --- 10. WORKFORCE ---
    const workforce = await WorkforceIntegrityService.evaluateWorkforceReadiness(supabase, workspaceId);`
);

fs.writeFileSync(file, c);
console.log('patched commandCenter.ts');
