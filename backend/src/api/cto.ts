import express from 'express';
import { requireAuth } from '../middleware/auth';
import { getServiceSupabase } from '../db/supabaseClient';

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

router.get('/:workspaceId', async (req: any, res) => {
    const { workspaceId } = req.params;
    const db = req.supabase;
    
    try {
        const { data: workspace } = await db.from('workspaces').select('cto_status, cto_locked_until').eq('id', workspaceId).single();
        let incidents = []; try { const res = await db.from('incidents').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20); incidents = res.data || []; } catch(e) {}
        
        // Also get connections to display capabilities to the user
        const { data: connections } = await db.from('company_systems').select('*').eq('workspace_id', workspaceId).in('system_type', ['GITHUB', 'VERCEL']);

        res.json({
            workspace,
            incidents: incidents || [],
            systems: connections || []
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/:workspaceId/diagnostic', async (req: any, res) => {
    const { workspaceId } = req.params;
    const db = req.supabase;
    
    try {
        // Update CTO Status
        await db.from('workspaces').update({ cto_status: 'DIAGNOSING' }).eq('id', workspaceId);
        
        // Wait briefly
        setTimeout(async () => {
            const service = getServiceSupabase();
            if(!service) return;
            
            // Create a mock incident
            await service.from('incidents').insert({
                workspace_id: workspaceId,
                type: 'TECHNICAL',
                severity: 'high',
                status: 'DETECTED',
                title: `Database Connection Timeout`,
                description: `A critical connection timeout was detected on the main production database cluster.`,
                source: 'MANUAL_DIAGNOSTIC',
                evidence: { error: 'Error: Connection Refused', latency: '5000ms' }
            });
            
            await service.from('workspaces').update({ cto_status: 'IDLE' }).eq('id', workspaceId);
            
            // Trigger an approval request to demonstrate the CTO asking for permission to rollback
            await service.from('approvals').insert({
                 workspace_id: workspaceId,
                 action: 'PRODUCTION_DEPLOYMENT',
                 title: 'Rollback Database Migration',
                 reason: 'The latest database migration is causing connection timeouts. Rollback is required to restore service.',
                 requested_by_executive: 'CTO',
                 risk_level: 'critical',
                 status: 'PENDING_APPROVAL',
                 context: {
                     incident: 'Database Connection Timeout',
                     rollback_target: 'v2.1.0',
                     estimated_downtime: '0s'
                 },
                 expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });

        }, 2000);

        res.json({ success: true, message: 'Diagnostic scan started.' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
