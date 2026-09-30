const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'CEOService.ts');
let content = fs.readFileSync(file, 'utf8');

const newCode = `
    // V5.10 Autonomous CEO Loop
    static async operate(supabase: SupabaseClient, workspaceId: string, context?: any) {
        const { data: ws } = await supabase.from('workspaces').select('operating_state, ceo_locked_until').eq('id', workspaceId).single();
        if (!ws) return;
        
        if (ws.operating_state === 'PAUSED' || ws.operating_state === 'STOPPED') {
            return;
        }

        const now = Date.now();
        if (ws.ceo_locked_until && new Date(ws.ceo_locked_until).getTime() > now) {
            return;
        }

        const lease = new Date(now + 2 * 60 * 1000).toISOString();
        await supabase.from('workspaces').update({ ceo_locked_until: lease, ceo_status: 'STRATEGIZING' }).eq('id', workspaceId);

        try {
            await this.executeStrategicLoop(supabase, workspaceId, context);
        } finally {
            await supabase.from('workspaces').update({ ceo_locked_until: null, ceo_status: 'IDLE' }).eq('id', workspaceId);
        }
    }

    private static async executeStrategicLoop(supabase: SupabaseClient, workspaceId: string, context?: any) {
        // Prevent infinite recursion loops
        const currentDepth = context?.depth || 0;
        if (currentDepth > 3) {
            console.error('[CEOService] Max strategic depth reached. Halting recursion.');
            return;
        }
        
        // 1. Observe Active Goals
        const { data: goals } = await supabase.from('business_goals')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('status', 'ACTIVE');

        if (!goals || goals.length === 0) return;

        let conflictDetected = false;
        
        // Identify if multiple active goals create a conflict (e.g., spending vs saving)
        const costGoals = goals.filter((g: any) => g.objective.toLowerCase().includes('cost') || g.target_metric?.toLowerCase().includes('budget'));
        const growthGoals = goals.filter((g: any) => g.objective.toLowerCase().includes('growth') || g.objective.toLowerCase().includes('customer'));
        
        if (costGoals.length > 0 && growthGoals.length > 0) {
            conflictDetected = true;
            const { CompanyMemoryService } = require('./CompanyMemoryService');
            await CompanyMemoryService.createMemory({
                workspaceId,
                category: 'STRATEGY',
                title: 'Strategic Conflict Detected',
                content: 'CEO identified a strategic conflict between aggressive growth and strict cost reduction. Requesting COO analysis.',
                sourceType: 'EXECUTIVE',
                sourceId: 'CEO',
                verificationStatus: 'SOURCE_BACKED',
                createdBy: 'SYSTEM'
            }, supabase);
        }

        for (const goal of goals) {
            // Priority logic
            let priority = 'MEDIUM';
            if (goal.objective.toLowerCase().includes('critical') || conflictDetected) {
                priority = 'HIGH';
            }
            if (goal.priority !== priority) {
                await supabase.from('business_goals').update({ priority }).eq('id', goal.id);
            }

            // Verify completed constraints (CEO independently verifies failures or successes reported by COO)
            const { data: relatedDeps } = await supabase.from('objective_dependencies')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('source_objective_id', goal.id)
                .eq('status', 'ACTIVE');
                
            if (relatedDeps && relatedDeps.length > 0) {
                 const blocker = relatedDeps[0];
                 // If CEO finds a strategy blocker, delegate it down.
                 if (blocker.blocking_executive) {
                     const nextContext = { depth: currentDepth + 1, visited: [...(context?.visited || []), 'CEO'] };
                     await this.delegateToExecutive(supabase, workspaceId, 'COO', nextContext);
                 }
            } else {
                 // Forward to COO for operational handling
                 const nextContext = { depth: currentDepth + 1, visited: [...(context?.visited || []), 'CEO'] };
                 await this.delegateToExecutive(supabase, workspaceId, 'COO', nextContext);
            }
        }
    }

    private static async delegateToExecutive(supabase: SupabaseClient, workspaceId: string, executive: string, context: any) {
        if (context.visited && context.visited.includes(executive)) {
            console.error('[CEOService] Circular execution detected. Blocking loop to ' + executive);
            // Record recursion block
            const { CompanyMemoryService } = require('./CompanyMemoryService');
            await CompanyMemoryService.createMemory({
                workspaceId,
                category: 'FAILURE',
                title: 'Recursion Loop Prevented',
                content: \`CEO attempted to delegate to \${executive} but detected a cycle. Halting recursion.\`,
                sourceType: 'EXECUTIVE',
                sourceId: 'CEO',
                verificationStatus: 'SOURCE_BACKED',
                createdBy: 'SYSTEM'
            }, supabase);
            return;
        }
        
        try {
            if (executive === 'COO') {
                const { COOService } = require('./COOService');
                await COOService.operate(supabase, workspaceId);
            }
        } catch (e: any) {
            console.error('[CEOService] Delegation error:', e.message);
        }
    }
`;

content = content.replace(/}\s*$/, newCode + '\n}');
fs.writeFileSync(file, content);
console.log('Done');
