import { Router } from 'express';
import { getServiceSupabase } from '../db/supabaseClient';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { CompanyDiscoveryService } from '../services/CompanyDiscoveryService';

const router = Router({ mergeParams: true });

// POST start discovery
router.post('/', requireAuth, async (req: AuthRequest, res) => {
    try {
        const workspaceId = req.params.workspaceId as string;
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });
        
        const discovery = await CompanyDiscoveryService.startDiscovery(getServiceSupabase()!, workspaceId, url);
        res.json({ success: true, discovery });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET discovery status
router.get('/', requireAuth, async (req: AuthRequest, res) => {
    try {
        const workspaceId = req.params.workspaceId as string;
        const { data: discoveries, error } = await getServiceSupabase()!
            .from('company_discoveries')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ discoveries });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
