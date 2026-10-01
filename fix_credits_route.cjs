const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

const endpoint = `
router.get('/:id/credits', async (req: AuthRequest, res) => {
  try {
     const credits = await CreditService.getCredits(req.supabase!, req.params.id);
     res.json({ credits });
  } catch(e: any) {
     res.status(500).json({ error: e.message });
  }
});
`;

// Insert it right before the router.get('/:id/command-center')
content = content.replace(
  "router.get('/:id/command-center', async (req: AuthRequest, res) => {",
  endpoint + "\nrouter.get('/:id/command-center', async (req: AuthRequest, res) => {"
);

fs.writeFileSync(file, content);
console.log('Added /credits endpoint correctly');
