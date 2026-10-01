const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

const getCreditsRoute = `
  // Get Workspace Credits
  router.get('/:id/credits', async (req: AuthRequest, res) => {
    try {
      if (!req.supabase) return res.status(400).json({ error: 'DB required' });
      const workspaceId = req.params.id;
      
      const { data, error } = await req.supabase
        .from('workspaces')
        .select('credits, owner_id')
        .eq('id', workspaceId)
        .single();
        
      if (error || !data) {
        return res.status(404).json({ error: 'Workspace not found or unauthorized' });
      }
      
      if (data.owner_id !== req.user?.id) {
        return res.status(403).json({ error: 'Not authorized to view these credits' });
      }

      return res.json({ credits: typeof data.credits === 'number' ? data.credits : 200 });
    } catch (err: any) {
      console.error('[Workspaces] GET credits error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
`;

if (!content.includes('GET credits error')) {
    content = content.replace(
      "router.post('/:id/approvals/:approvalId/approve', async (req: AuthRequest, res) => {",
      getCreditsRoute + "\n\n  router.post('/:id/approvals/:approvalId/approve', async (req: AuthRequest, res) => {"
    );
    fs.writeFileSync(file, content);
    console.log('Added GET /:id/credits');
} else {
    console.log('GET /:id/credits already exists');
}
