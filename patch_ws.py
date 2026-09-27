import re

path = 'backend/src/api/workspaces.ts'
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
    "import { z } from 'zod';",
    "import { z } from 'zod';\nimport { EntitlementService } from '../services/EntitlementService';"
)

c = c.replace(
    "export default router;",
    """
// V3.7: Plan and Entitlement Retrieval
router.get('/:id/plan', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) return res.json(EntitlementService.getPlanEntitlements('SOLO_BUILDER'));
    const workspaceId = req.params.id;
    const entitlements = await EntitlementService.getWorkspaceEntitlements(req.supabase, workspaceId);
    
    const { count: currentWorkers } = await req.supabase.from('agents').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId);

    res.json({
      plan: 'SOLO_BUILDER',
      entitlements,
      usage: {
        workers: currentWorkers || 0
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
"""
)

with open(path, 'w') as f:
    f.write(c)

print('patched workspaces.ts')
