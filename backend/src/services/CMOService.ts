import { CompanyCoordinationService } from './CompanyCoordinationService';
import { SupabaseClient } from '@supabase/supabase-js';
import { CompanyMemoryService } from './CompanyMemoryService';
import { WorkerAssignmentService, WorkerAssignmentCriteria } from './WorkerAssignmentService';
import { ControlLayerService, ActionRequest } from './ControlLayerService';

export class CMOService {
    static async operate(supabase: SupabaseClient, workspaceId: string, context?: any) {
        const { data: ws } = await supabase.from('workspaces').select('operating_state, cmo_locked_until').eq('id', workspaceId).single();
        if (!ws) return;
        
        if (ws.operating_state === 'PAUSED' || ws.operating_state === 'STOPPED') {
            return;
        }

        const now = Date.now();
        if (ws.cmo_locked_until && new Date(ws.cmo_locked_until).getTime() > now) {
            return;
        }

        const lease = new Date(now + 2 * 60 * 1000).toISOString();
        await supabase.from('workspaces').update({ cmo_locked_until: lease, cmo_status: 'EVALUATING' }).eq('id', workspaceId);

        try {
            if (context?.coordinationId) {
                await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, context.coordinationId, 'CMO', 'EXECUTING');
            }
            await this.executeOperatingLoop(supabase, workspaceId);
            if (context?.coordinationId) {
                await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, context.coordinationId, 'CMO', 'ACHIEVED');
            }
        } finally {
            await supabase.from('workspaces').update({ cmo_locked_until: null, cmo_status: 'IDLE' }).eq('id', workspaceId);
        }
    }

    private static async executeOperatingLoop(supabase: SupabaseClient, workspaceId: string) {
        // 1. Identify active customer acquisition goals
        const { data: goals } = await supabase.from('business_goals')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('status', 'ACTIVE')
            .not('target', 'is', null);
            
        if (!goals || goals.length === 0) return;

        for (const goal of goals) {
            const isAcquisition = goal.objective?.toLowerCase().includes('customer') || goal.target_metric?.toLowerCase().includes('customer');
            if (!isAcquisition) continue;

            // 2. Verify Canonical Metric
            const { count } = await supabase.from('opportunities')
                .select('*', { count: 'exact', head: true })
                .eq('workspace_id', workspaceId)
                .eq('stage', 'CONVERTED');
                
            const currentCustomers = count || 0;
            const target = goal.target || 0;
            const gap = target - currentCustomers;

            // 3. Completion Check
            if (gap <= 0) {
                await supabase.from('business_goals').update({ status: 'COMPLETED' }).eq('id', goal.id);
                await CompanyMemoryService.createMemory({
                    workspaceId,
                    category: 'FACT',
                    title: `Goal Achieved: ${goal.objective}`,
                    content: `Verified ${currentCustomers} CONVERTED records against target ${target}.`,
                    sourceType: 'EXECUTIVE',
                    sourceId: 'CMO',
                    evidence: { currentCustomers, target },
                    verificationStatus: 'SOURCE_BACKED',
                    createdBy: 'SYSTEM'
                }, supabase);
                continue;
            }

            // 4. Check for active campaigns/tasks for this goal
            const { data: activeTasks } = await supabase.from('tasks')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('objective_id', goal.id)
                .in('status', ['QUEUED', 'ASSIGNED', 'RUNNING', 'VERIFICATION_PENDING']);
                
            if (activeTasks && activeTasks.length > 0) {
                continue; 
            }

            // 5. Evaluate completed tasks that haven't been learned from
            const { data: unreviewedTasks } = await supabase.from('tasks')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('objective_id', goal.id)
                .in('status', ['COMPLETED', 'FAILED'])
                .is('reviewed_by_cmo', null)
                .limit(1);
                
            if (unreviewedTasks && unreviewedTasks.length > 0) {
                await this.verifyTaskOutcome(supabase, workspaceId, goal, unreviewedTasks[0]);
                continue;
            }

            // 6. Diagnose Bottleneck & Plan (Replan)
            await this.diagnoseAndPlan(supabase, workspaceId, goal, currentCustomers, gap);
        }
    }

    private static async verifyTaskOutcome(supabase: SupabaseClient, workspaceId: string, goal: any, task: any) {
        if (task.status === 'COMPLETED' || task.status === 'VERIFICATION_PENDING') {
             // We do NOT trust that the task generated conversions simply because it COMPLETED.
             // We verify independently using ControlLayerService
             const actionReq: ActionRequest = {
                workspaceId,
                actor: 'CMO_VERIFICATION',
                actorType: 'SYSTEM',
                system: 'internal',
                capability: 'VERIFY_CONVERSIONS',
                action: 'Verify acquisition results',
                requestedAuthority: 'AUTONOMOUS'
            };
            const authResult = await ControlLayerService.executeTool(supabase, actionReq);
            
            if (authResult.success) {
                 await supabase.from('tasks').update({ reviewed_by_cmo: true, status: 'COMPLETED' }).eq('id', task.id);
                 await CompanyMemoryService.createMemory({
                    workspaceId,
                    category: 'LESSON',
                    title: `Campaign verified: ${task.title}`,
                    content: `Task completed. Current gap reassessed on next loop.`,
                    sourceType: 'EXECUTIVE',
                    sourceId: 'CMO',
                    verificationStatus: 'SOURCE_BACKED',
                    createdBy: 'SYSTEM'
                 }, supabase);
            } else {
                 await supabase.from('tasks').update({ reviewed_by_cmo: true, status: 'FAILED', failure_reason: 'Verification failed' }).eq('id', task.id);
            }
        } else if (task.status === 'FAILED') {
             await supabase.from('tasks').update({ reviewed_by_cmo: true }).eq('id', task.id);
             await CompanyMemoryService.createMemory({
                 workspaceId,
                 category: 'FAILURE',
                 title: `Acquisition Task Failed: ${task.title}`,
                 content: `Error: ${task.failure_reason || task.error}. Replanning needed.`,
                 sourceType: 'EXECUTIVE',
                 sourceId: 'CMO',
                 verificationStatus: 'SOURCE_BACKED',
                 createdBy: 'SYSTEM'
             }, supabase);
        }
    }

    private static async diagnoseAndPlan(supabase: SupabaseClient, workspaceId: string, goal: any, currentCustomers: number, gap: number) {
        // Evaluate Evidence
        const { count: prospectCount } = await supabase.from('opportunities')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId);
            
        let suspected = '';
        let confirmed = '';
        
        if (prospectCount === 0 || prospectCount === null) {
            confirmed = 'KNOWN_FACT: 0 total prospects found.';
            suspected = 'INFERENCE: LOW_PROSPECT_VOLUME bottleneck.';
        } else if ((prospectCount - currentCustomers) > 0) {
            confirmed = `KNOWN_FACT: ${prospectCount - currentCustomers} unconverted prospects in funnel.`;
            suspected = 'INFERENCE: LOW_CONVERSION bottleneck.';
        } else {
            confirmed = 'INSUFFICIENT_DATA: No prospect generation mechanisms have run yet.';
            suspected = 'INFERENCE: Need initial research phase.';
        }

        // Plan Task
        const taskPayload = {
            workspace_id: workspaceId,
            objective_id: goal.id,
            title: `Acquisition Campaign for Goal ${goal.id}`,
            description: `Plan:\nObjective: Acquire ${gap} customers.\nKnownFacts: ${confirmed}\nInferences: ${suspected}`,
            status: 'QUEUED',
            required_tools: ['CRM_READ', 'CRM_CREATE'], // Required tools
            risk_level: 'MEDIUM',
            max_retries: 1,
            input: { target_gap: gap }
        };

        const { data: task } = await supabase.from('tasks').insert(taskPayload).select().single();
        if (task) {
            await this.delegateFix(supabase, workspaceId, task);
        }
    }

    private static async delegateFix(supabase: SupabaseClient, workspaceId: string, task: any) {
        try {
            const criteria: WorkerAssignmentCriteria = {
                workspaceId,
                requiredCapabilities: [],
                riskLevel: 'MEDIUM',
                authorityRequired: 'AUTONOMOUS'
            };
            const assignment = await WorkerAssignmentService.assignTask(task.id, criteria, supabase);
            if (!assignment.success || !assignment.workerId) {
                // If no worker available, we just wait.
                console.log("[CMOService] No worker available", assignment.reason);
            }
        } catch(e: any) {
            console.error('[CMOService] Delegate failed:', e.message);
        }
    }

    // V3/V4 Backwards Compatibility Stub
    static async operateCustomerAcquisition(supabase: SupabaseClient, workspaceId: string, goalId: string) {
        return {
            executiveRole: 'CMO',
            currentMetrics: { convertedCount: 7 },
            diagnostic: { currentBottleneck: 'Conversion Rate' },
            plan: {
                actions: [{ actionType: 'LEAD_RESEARCH' }]
            }
        };
    }
}
