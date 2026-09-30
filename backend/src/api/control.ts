import { Router } from 'express';
import { getServiceSupabase } from '../db/supabaseClient';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { ControlLayerService } from '../services/ControlLayerService';

const router = Router({ mergeParams: true });

// GET company control state
router.get('/state', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { data: ws, error } = await getServiceSupabase()!.from('workspaces').select('operating_state').eq('id', (req.params.workspaceId as string)).single();
        if (error) { if (error.message.includes("relation")) return res.json({ systems: [] }); throw error; }
        res.json({ operating_state: ws.operating_state });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST pause / resume / stop
router.post('/state', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { state } = req.body;
        if (!['OPERATING', 'PAUSED', 'WAITING_FOR_FOUNDER', 'STOPPED'].includes(state)) {
            return res.status(400).json({ error: 'Invalid state' });
        }
        await ControlLayerService.setOperatingState(getServiceSupabase()!, (req.params.workspaceId as string), state as any);
        res.json({ success: true, operating_state: state });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET company systems
router.get('/systems', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { data: systems, error } = await getServiceSupabase()!.from('company_systems').select('*').eq('workspace_id', (req.params.workspaceId as string));
        if (error) { if (error.message.includes("relation")) return res.json({ auditLogs: [] }); throw error; }
        res.json({ systems });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET action audit history
router.get('/audit', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { data: auditLogs, error } = await getServiceSupabase()!
            .from('action_audit_logs')
            .select('*')
            .eq('workspace_id', (req.params.workspaceId as string))
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) { if (error.message.includes("relation")) return res.json({ approvals: [] }); throw error; }
        res.json({ auditLogs });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET pending approvals
router.get('/approvals/pending', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { data: approvals, error } = await getServiceSupabase()!
            .from('approvals')
            .select('*')
            .eq('workspace_id', (req.params.workspaceId as string))
            .eq('status', 'PENDING_APPROVAL')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ approvals });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

