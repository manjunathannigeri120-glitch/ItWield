const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'api', 'company.ts');
let content = fs.readFileSync(file, 'utf8');

const healthEndpoint = `
// V5.12 Autonomy Health
router.get('/autonomy-health/:workspaceId', async (req: any, res: any) => {
    try {
        const supabase = getServiceSupabase();
        if (!supabase) return res.status(500).json({ error: 'Service error' });

        const { data: ws } = await supabase.from('workspaces').select('operating_state, ceo_locked_until, coo_locked_until, cmo_locked_until, cto_locked_until, cfo_locked_until').eq('id', req.params.workspaceId).single();
        const { data: coordinations } = await supabase.from('company_coordinations').select('*').eq('workspace_id', req.params.workspaceId);
        const { data: tasks } = await supabase.from('tasks').select('*').eq('workspace_id', req.params.workspaceId).in('status', ['RUNNING', 'FAILED', 'PENDING']);
        
        let activeObj = 0;
        let blockedObj = 0;
        if (coordinations) {
            for (const c of coordinations) {
                if (c.status === 'ACTIVE') activeObj++;
                if (c.status === 'BLOCKED') blockedObj++;
            }
        }

        const health = {
            systemHealth: {
                database: 'HEALTHY',
                executives: 'HEALTHY',
                workers: 'HEALTHY',
                verification: 'HEALTHY'
            },
            activeObjectives: {
                active: activeObj,
                blocked: blockedObj,
                waiting: 0,
                stale: 0,
                replanning: 0
            },
            recovery: {
                retries: tasks?.filter(t => t.status === 'PENDING').length || 0,
                recoveries: 0,
                reassignments: 0,
                openCircuitBreakers: 0
            },
            attentionRequired: {
                criticalIncident: 0,
                persistentFailure: tasks?.filter(t => t.status === 'FAILED').length || 0
            }
        };
        res.json({ ok: true, health });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});
`;

content = content.replace(/export const companyRouter = router;/g, healthEndpoint + '\nexport const companyRouter = router;');

fs.writeFileSync(file, content);
