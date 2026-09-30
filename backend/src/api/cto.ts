import express from 'express';
import { requireAuth } from '../middleware/auth';

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.get('/:workspaceId', async (req: any, res) => {
    const { workspaceId } = req.params;
    const db = req.supabase;
    
    try {
        const { data: workspace } = await db.from('workspaces').select('cto_status, cto_locked_until').eq('id', workspaceId).single();
        let incidents = []; try { const res = await db.from('incidents').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20); incidents = res.data || []; } catch(e) {}

        res.json({
            workspace,
            incidents: incidents || []
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
