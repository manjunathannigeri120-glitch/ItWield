const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { ContinuousImprovementService } from '../services/ContinuousImprovementService';",
  "import { ContinuousImprovementService } from '../services/ContinuousImprovementService';\nimport { CreditService } from '../services/CreditService';"
);

// I want to inject credits into the workspace response.
// The endpoint is likely router.get('/', ...) and router.get('/:id', ...)
// Let's just find where it returns workspaces and map them. Or I'll just write a new endpoint for credits to be safe!
const endpoint = `
router.get('/:id/credits', async (req, res) => {
  try {
     const credits = await CreditService.getCredits(req.supabase, req.params.id);
     res.json({ credits });
  } catch(e) {
     res.status(500).json({ error: e.message });
  }
});
`;

content = content.replace(
  "router.get('/:id/command-center', async (req: AuthRequest, res) => {",
  endpoint + "\nrouter.get('/:id/command-center', async (req: AuthRequest, res) => {"
);

fs.writeFileSync(file, content);
console.log('Added /credits endpoint');
