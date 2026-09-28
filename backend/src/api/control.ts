import { Router } from 'express';
import { supabase } from '../utils/supabaseClient';
import { requireAuth, requireWorkspace } from './auth';
import { ControlLayerService } from '../services/ControlLayerService';

const router = Router();

// GET company control state
router.get('/state', requireAuth, requireWorkspace, async (req, res) => {
    try {
        const { data: ws, error } = await supabase.from('workspaces').select('operating_state').eq('id', req.workspaceId).single();
        if (error) throw error;
        res.json({ operating_state: ws.operating_state });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST pause / resume / stop
router.post('/state', requireAuth, requireWorkspace, async (req, res) => {
    try {
        const { state } = req.body;
        if (!['OPERATING', 'PAUSED', 'WAITING_FOR_FOUNDER', 'STOPPED'].includes(state)) {
            return res.status(400).json({ error: 'Invalid state' });
        }
        await ControlLayerService.setOperatingState(supabase, req.workspaceId!, state as any);
        res.json({ success: true, operating_state: state });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET company systems
router.get('/systems', requireAuth, requireWorkspace, async (req, res) => {
    try {
        const { data: systems, error } = await supabase.from('company_systems').select('*').eq('workspace_id', req.workspaceId);
        if (error) throw error;
        res.json({ systems });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET action audit history
router.get('/audit', requireAuth, requireWorkspace, async (req, res) => {
    try {
        const { data: auditLogs, error } = await supabase
            .from('action_audit_logs')
            .select('*')
            .eq('workspace_id', req.workspaceId)
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) throw error;
        res.json({ auditLogs });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// GET pending approvals
router.get('/approvals/pending', requireAuth, requireWorkspace, async (req, res) => {
    try {
        const { data: approvals, error } = await supabase
            .from('approvals')
            .select('*')
            .eq('workspace_id', req.workspaceId)
            .eq('status', 'PENDING_APPROVAL')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ approvals });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
