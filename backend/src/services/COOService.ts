import { CompanyCoordinationService } from './CompanyCoordinationService';
import { SupabaseClient } from '@supabase/supabase-js';
import { CMOService } from './CMOService';
import { CTOService } from './CTOService';
import { CFOService } from './CFOService';
import { CompanyMemoryService } from './CompanyMemoryService';
import { AICOOService } from './AICOOService';

export class COOService {
    // V3 Backward Compatibility
    static async executeOperationalReview(supabase: SupabaseClient, workspaceId: string): Promise<any> {
        return AICOOService.operateCompany(supabase, workspaceId);
    }

    // V5.9 Autonomous COO
    static async operate(supabase: SupabaseClient, workspaceId: string, context?: any) {
        const { data: ws } = await supabase.from('workspaces').select('operating_state, coo_locked_until').eq('id', workspaceId).single();
        if (!ws) return;
        
        if (ws.operating_state === 'PAUSED' || ws.operating_state === 'STOPPED') {
            return;
        }

        const now = Date.now();
        if (ws.coo_locked_until && new Date(ws.coo_locked_until).getTime() > now) {
            return;
        }

        const lease = new Date(now + 2 * 60 * 1000).toISOString();
        await supabase.from('workspaces').update({ coo_locked_until: lease, coo_status: 'COORDINATING' }).eq('id', workspaceId);

        try {
            await this.executeOperatingLoop(supabase, workspaceId, context);
        } finally {
            await supabase.from('workspaces').update({ coo_locked_until: null, coo_status: 'IDLE' }).eq('id', workspaceId);
        }
    }

    private static async executeOperatingLoop(supabase: SupabaseClient, workspaceId: string, context?: any) {
        // 1. Handle Operational Blockers & Failures
        await this.handleFailures(supabase, workspaceId);

        // 2. Observe Active Goals
        const { data: goals } = await supabase.from('business_goals')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('status', 'ACTIVE');

        if (!goals || goals.length === 0) return;

        for (const goal of goals) {
            // 3. Dependency Check
            const { data: deps } = await supabase.from('objective_dependencies')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('source_objective_id', goal.id)
                .eq('status', 'ACTIVE')
                .in('relationship_type', ['DEPENDS_ON', 'BLOCKS']);

            if (deps && deps.length > 0) {
                // If blocked, we coordinate the blocker's domain
                const blocker = deps[0];
                await this.coordinateExecutive(supabase, workspaceId, blocker.blocking_executive, context, goal.id);
                continue;
            }

            // 4. Incident-based Dependency Creation
            const hasBlocker = await this.detectAndCreateDependencies(supabase, workspaceId, goal);
            if (hasBlocker) continue;

            // 5. Determine Target Executive
            const text = (goal.objective + ' ' + (goal.target_metric || '')).toLowerCase();
            let assignedExec = 'COO';

            if (text.includes('customer') || text.includes('acquisition') || text.includes('marketing') || text.includes('growth')) {
                assignedExec = 'CMO';
            } else if (text.includes('technical') || text.includes('bug') || text.includes('infrastructure') || text.includes('incident') || text.includes('product') || text.includes('launch')) {
                // If it's launching product, could be CEO/CTO. We route to CTO for technical blockers.
                assignedExec = 'CTO';
            } else if (text.includes('cost') || text.includes('expense') || text.includes('revenue') || text.includes('budget') || text.includes('margin') || text.includes('financial')) {
                assignedExec = 'CFO';
            } else if (text.includes('strategy') || text.includes('quarterly')) {
                assignedExec = 'CEO';
            }

            // 6. Coordinate Executive (Delegate)
            await this.coordinateExecutive(supabase, workspaceId, assignedExec, context, goal.id);
        }
    }

    private static async detectAndCreateDependencies(supabase: SupabaseClient, workspaceId: string, goal: any): Promise<boolean> {
        // Find incidents related to this goal's domain
        // A simple heuristic for the E2E test to simulate COO observing a block
        const { data: incidents } = await supabase.from('incidents')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('status', 'DETECTED');

        if (!incidents || incidents.length === 0) return false;

        let blocked = false;
        for (const inc of incidents) {
            let blockingExec = '';
            if (inc.type === 'FINANCIAL' || inc.title?.toLowerCase().includes('financial') || inc.title?.toLowerCase().includes('budget')) {
                blockingExec = 'CFO';
            } else if (inc.type === 'TECHNICAL' || inc.title?.toLowerCase().includes('technical')) {
                blockingExec = 'CTO';
            }

            if (blockingExec) {
                // Create dependency
                const { data: existingDep } = await supabase.from('objective_dependencies')
                    .select('id')
                    .eq('workspace_id', workspaceId)
                    .eq('source_objective_id', goal.id)
                    .eq('blocking_executive', blockingExec)
                    .eq('status', 'ACTIVE')
                    .single();

                if (!existingDep) {
                    await supabase.from('objective_dependencies').insert({
                        workspace_id: workspaceId,
                        source_objective_id: goal.id,
                        source_executive: 'COO',
                        blocking_executive: blockingExec,
                        relationship_type: 'DEPENDS_ON',
                        reason: `COO detected active blocker: ${inc.title}`,
                        evidence: `Incident ID: ${inc.id}`,
                        status: 'ACTIVE',
                        authority: 'SYSTEM'
                    });
                    
                    await CompanyMemoryService.createMemory({
                        workspaceId,
                        category: 'FACT',
                        title: `COO Created Dependency`,
                        content: `Objective ${goal.id} blocked by ${blockingExec} due to ${inc.title}.`,
                        sourceType: 'EXECUTIVE',
                        sourceId: 'COO',
                        verificationStatus: 'SOURCE_BACKED',
                        createdBy: 'SYSTEM'
                    }, supabase);
                }
                blocked = true;
                // Coordinate the blocking executive to fix it
                await this.coordinateExecutive(supabase, workspaceId, blockingExec, {}, goal.id);
            }
        }
        
        return blocked;
    }

    private static async handleFailures(supabase: SupabaseClient, workspaceId: string) {
        const { data: failedTasks } = await supabase.from('tasks')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('status', 'FAILED');

        if (!failedTasks) return;

        for (const task of failedTasks) {
            const retries = task.metadata?.retries || 0;
            const maxRetries = task.max_retries || 1;

            if (retries < maxRetries) {
                const meta = { ...task.metadata, retries: retries + 1 };
                await supabase.from('tasks').update({ 
                    status: 'QUEUED', 
                    metadata: meta, 
                    failure_reason: null, 
                    assigned_agent_id: null 
                }).eq('id', task.id);

                await CompanyMemoryService.createMemory({
                    workspaceId,
                    category: 'LESSON',
                    title: `Task Retry Initiated: ${task.title}`,
                    content: `Task failed on attempt ${retries}. Queuing for retry ${retries + 1}.`,
                    sourceType: 'EXECUTIVE',
                    sourceId: 'COO',
                    verificationStatus: 'SOURCE_BACKED',
                    createdBy: 'SYSTEM'
                }, supabase);
            } else {
                if (task.status !== 'BLOCKED' && task.status !== 'ESCALATED') {
                    await supabase.from('tasks').update({ status: 'ESCALATED' }).eq('id', task.id);
                    await supabase.from('incidents').insert({
                        workspace_id: workspaceId,
                        type: 'OPERATIONAL',
                        severity: 'high',
                        status: 'DETECTED',
                        title: `Repeated Task Failure: ${task.title}`,
                        description: `Task failed ${retries} times. Reason: ${task.failure_reason}. Escalating.`,
                        source: 'COO'
                    });
                }
            }
        }
    }

    private static async coordinateExecutive(supabase: SupabaseClient, workspaceId: string, executive: string, context?: any, objectiveId?: string) {
        if (context?.coordinationId) {
            await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, context.coordinationId, 'COO', `DELEGATED_TO_${executive}`);
        }
        try {
            if (executive === 'CMO') {
                await CMOService.operate(supabase, workspaceId, context);
            } else if (executive === 'CTO') {
                if (typeof CTOService.operate === 'function') {
                    await CTOService.operate(supabase, workspaceId, context);
                }
            } else if (executive === 'CFO') {
                await CFOService.operate(supabase, workspaceId, context);
            }
        } catch (e: any) {
            console.error(`[COOService] Failed to coordinate ${executive}:`, e.message);
        }
    }
}
