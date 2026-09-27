import re

path = 'backend/src/api/workspaces.ts'
with open(path, 'r') as f:
    c = f.read()

importReplacement = "import { SubscriptionService } from '../services/SubscriptionService';\nimport { UsageService } from '../services/UsageService';\nimport { EntitlementService } from '../services/EntitlementService';"
c = c.replace("import { EntitlementService } from '../services/EntitlementService';", importReplacement)

newRoutes = """router.get('/:id/plan', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase || !req.user) return res.status(500).json({ error: 'System unavailable' });
    const workspaceId = req.params.id as string;
    
    const subscription = await SubscriptionService.getWorkspaceSubscription(req.supabase, workspaceId);
    const usageSnapshot = await UsageService.getUsageSnapshot(req.supabase, workspaceId);
    const entitlements = await EntitlementService.getWorkspaceEntitlements(req.supabase, workspaceId);
    
    res.json({
      subscription,
      entitlements,
      usage: usageSnapshot
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/plan', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase || !req.user) return res.status(500).json({ error: 'System unavailable' });
    const workspaceId = req.params.id as string;
    const { planId } = req.body;
    
    if (!planId) return res.status(400).json({ error: 'planId is required' });

    const subscription = await SubscriptionService.changePlan(req.supabase, workspaceId, planId, req.user.id);
    res.json({ ok: true, subscription });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/subscription/cancel', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase || !req.user) return res.status(500).json({ error: 'System unavailable' });
    const workspaceId = req.params.id as string;
    const subscription = await SubscriptionService.cancelSubscription(req.supabase, workspaceId, req.user.id);
    res.json({ ok: true, subscription });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/subscription/reactivate', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase || !req.user) return res.status(500).json({ error: 'System unavailable' });
    const workspaceId = req.params.id as string;
    const subscription = await SubscriptionService.reactivateSubscription(req.supabase, workspaceId, req.user.id);
    res.json({ ok: true, subscription });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;"""

c = re.sub(r"router\.get\('/:id/plan'[\s\S]*?export default router;", newRoutes, c)

with open(path, 'w') as f:
    f.write(c)
print('patched workspaces API')
