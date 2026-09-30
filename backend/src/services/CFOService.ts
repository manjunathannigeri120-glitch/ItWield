import { CompanyCoordinationService } from './CompanyCoordinationService';
import { SupabaseClient } from '@supabase/supabase-js';
import { CompanyMemoryService } from './CompanyMemoryService';
import { WorkerAssignmentService, WorkerAssignmentCriteria } from './WorkerAssignmentService';
import { ControlLayerService, ActionRequest } from './ControlLayerService';

export class CFOService {
    static async operate(supabase: SupabaseClient, workspaceId: string, context?: any) {
        const { data: ws } = await supabase.from('workspaces').select('operating_state, cfo_locked_until').eq('id', workspaceId).single();
        if (!ws) return;
        
        if (ws.operating_state === 'PAUSED' || ws.operating_state === 'STOPPED') {
            return;
        }

        const now = Date.now();
        if (ws.cfo_locked_until && new Date(ws.cfo_locked_until).getTime() > now) {
            return;
        }

        const lease = new Date(now + 2 * 60 * 1000).toISOString();
        await supabase.from('workspaces').update({ cfo_locked_until: lease, cfo_status: 'EVALUATING' }).eq('id', workspaceId);

        try {
            if (context?.coordinationId) {
                await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, context.coordinationId, 'CFO', 'EXECUTING');
            }
            await this.executeOperatingLoop(supabase, workspaceId);
            if (context?.coordinationId) {
                await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, context.coordinationId, 'CFO', 'ACHIEVED');
            }
        } finally {
            await supabase.from('workspaces').update({ cfo_locked_until: null, cfo_status: 'IDLE' }).eq('id', workspaceId);
        }
    }

    private static async executeOperatingLoop(supabase: SupabaseClient, workspaceId: string) {
        const { data: goals } = await supabase.from('business_goals')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('status', 'ACTIVE');
            
        if (!goals || goals.length === 0) return;

        for (const goal of goals) {
            const metric = goal.target_metric?.toLowerCase() || '';
            const isFinancial = metric.includes('cost') || metric.includes('expense') || metric.includes('budget') || metric.includes('revenue') || metric.includes('cac') || metric.includes('profit');
            
            if (!isFinancial) continue;

            const metricData = await this.calculateFinancialMetric(supabase, workspaceId, metric);
            
            if (metricData.status === 'INSUFFICIENT_DATA') {
                await this.recordInsufficientData(supabase, workspaceId, goal, metricData.reason || 'Missing data');
                continue;
            }

            const current = metricData.value;
            const target = goal.target || 0;
            
            // Gap logic: if reducing cost, gap is current - target (if current <= target, success)
            // If increasing revenue, gap is target - current (if current >= target, success)
            const isReduction = metric.includes('cost') || metric.includes('expense') || metric.includes('cac');
            const isMet = isReduction ? (current <= target) : (current >= target);
            const gap = isReduction ? Math.max(0, current - target) : Math.max(0, target - current);

            if (isMet) {
                await supabase.from('business_goals').update({ status: 'COMPLETED' }).eq('id', goal.id);
                await CompanyMemoryService.createMemory({
                    workspaceId,
                    category: 'FACT',
                    title: `Financial Goal Achieved: ${goal.objective}`,
                    content: `Verified metric ${metric} reached ${current} against target ${target}.`,
                    sourceType: 'EXECUTIVE',
                    sourceId: 'CFO',
                    evidence: { current, target },
                    verificationStatus: 'SOURCE_BACKED',
                    createdBy: 'SYSTEM'
                }, supabase);
                continue;
            }

            const { data: activeTasks } = await supabase.from('tasks')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('objective_id', goal.id)
                .in('status', ['QUEUED', 'ASSIGNED', 'RUNNING', 'VERIFICATION_PENDING']);
                
            if (activeTasks && activeTasks.length > 0) continue; 

            const { data: unreviewedTasks } = await supabase.from('tasks')
                .select('*')
                .eq('workspace_id', workspaceId)
                .eq('objective_id', goal.id)
                .in('status', ['COMPLETED', 'FAILED'])
                .is('reviewed_by_cfo', null)
                .limit(1);
                
            if (unreviewedTasks && unreviewedTasks.length > 0) {
                await this.verifyTaskOutcome(supabase, workspaceId, goal, unreviewedTasks[0]);
                continue;
            }

            await this.diagnoseAndPlan(supabase, workspaceId, goal, current, gap, isReduction);
        }
    }

    private static async calculateFinancialMetric(supabase: SupabaseClient, workspaceId: string, metric: string) {
        if (metric.includes('expense') || metric.includes('cost')) {
             const { data, error } = await supabase.from('financial_records')
                 .select('amount')
                 .eq('workspace_id', workspaceId)
                 .eq('record_type', 'EXPENSE')
                 .eq('status', 'VERIFIED');
                 
             if (error || !data || data.length === 0) return { status: 'INSUFFICIENT_DATA', value: 0, reason: 'No verified expense records found.' };
             const total = data.reduce((sum, r) => sum + Number(r.amount), 0);
             return { status: 'OK', value: total };
        }
        
        if (metric.includes('revenue')) {
             const { data, error } = await supabase.from('financial_records')
                 .select('amount')
                 .eq('workspace_id', workspaceId)
                 .eq('record_type', 'REVENUE')
                 .eq('status', 'VERIFIED');
                 
             if (error || !data || data.length === 0) return { status: 'INSUFFICIENT_DATA', value: 0, reason: 'No verified revenue records found.' };
             const total = data.reduce((sum, r) => sum + Number(r.amount), 0);
             return { status: 'OK', value: total };
        }

        if (metric.includes('cac')) {
             const { data: expenses } = await supabase.from('financial_records')
                 .select('amount')
                 .eq('workspace_id', workspaceId)
                 .eq('record_type', 'EXPENSE')
                 .eq('category', 'MARKETING')
                 .eq('status', 'VERIFIED');
                 
             const { count: customers } = await supabase.from('opportunities')
                 .select('*', { count: 'exact', head: true })
                 .eq('workspace_id', workspaceId)
                 .eq('stage', 'CONVERTED');

             if (!expenses || expenses.length === 0) return { status: 'INSUFFICIENT_DATA', value: 0, reason: 'Missing verified marketing expense data.' };
             if (customers === null || customers === 0) return { status: 'INSUFFICIENT_DATA', value: 0, reason: 'Missing verified converted customers for CAC calculation.' };
             
             const totalSpend = expenses.reduce((sum, r) => sum + Number(r.amount), 0);
             return { status: 'OK', value: totalSpend / customers };
        }
        
        return { status: 'INSUFFICIENT_DATA', value: 0, reason: `Metric ${metric} logic not implemented or missing data sources.` };
    }

    private static async recordInsufficientData(supabase: SupabaseClient, workspaceId: string, goal: any, reason: string) {
        // Log this state if not already logged recently
        const { data: recent } = await supabase.from('incidents')
             .select('id')
             .eq('workspace_id', workspaceId)
             .eq('title', `Insufficient Financial Data: ${goal.objective}`)
             .eq('status', 'DETECTED')
             .single();
             
        if (!recent) {
            await supabase.from('incidents').insert({
                workspace_id: workspaceId,
                type: 'FINANCIAL',
                severity: 'medium',
                status: 'DETECTED',
                title: `Insufficient Financial Data: ${goal.objective}`,
                description: `CFO bottleneck: ${reason}`,
                source: 'CFO_OPERATING_LOOP'
            });
        }
    }

    private static async verifyTaskOutcome(supabase: SupabaseClient, workspaceId: string, goal: any, task: any) {
        if (task.status === 'COMPLETED' || task.status === 'VERIFICATION_PENDING') {
             const actionReq: ActionRequest = {
                workspaceId,
                actor: 'CFO_VERIFICATION',
                actorType: 'SYSTEM',
                system: 'internal',
                capability: 'VERIFY_FINANCIAL_IMPACT',
                action: 'Verify financial execution outcomes',
                requestedAuthority: 'AUTONOMOUS'
            };
            const authResult = await ControlLayerService.executeTool(supabase, actionReq);
            
            if (authResult.success) {
                 await supabase.from('tasks').update({ reviewed_by_cfo: true, status: 'COMPLETED' }).eq('id', task.id);
                 await CompanyMemoryService.createMemory({
                    workspaceId,
                    category: 'LESSON',
                    title: `Financial Action Verified: ${task.title}`,
                    content: `Action completed. Re-evaluating financial baseline to confirm exact savings/revenue.`,
                    sourceType: 'EXECUTIVE',
                    sourceId: 'CFO',
                    verificationStatus: 'SOURCE_BACKED',
                    createdBy: 'SYSTEM'
                 }, supabase);
            } else {
                 await supabase.from('tasks').update({ reviewed_by_cfo: true, status: 'FAILED', failure_reason: 'Independent financial verification failed' }).eq('id', task.id);
            }
        } else if (task.status === 'FAILED') {
             await supabase.from('tasks').update({ reviewed_by_cfo: true }).eq('id', task.id);
             await CompanyMemoryService.createMemory({
                 workspaceId,
                 category: 'FAILURE',
                 title: `Financial Task Failed: ${task.title}`,
                 content: `Error: ${task.failure_reason || task.error}.`,
                 sourceType: 'EXECUTIVE',
                 sourceId: 'CFO',
                 verificationStatus: 'SOURCE_BACKED',
                 createdBy: 'SYSTEM'
             }, supabase);
        }
    }

    private static async diagnoseAndPlan(supabase: SupabaseClient, workspaceId: string, goal: any, current: number, gap: number, isReduction: boolean) {
        let suspected = 'INFERENCE: Potential unoptimized processes or missing control policies.';
        let confirmed = `KNOWN_FACT: Current metric is ${current}, gap is ${gap}.`;

        const taskPayload = {
            workspace_id: workspaceId,
            objective_id: goal.id,
            title: `Financial Operation for Goal ${goal.id}`,
            description: `Plan:\nObjective: ${isReduction ? 'Reduce' : 'Increase'} metric by ${gap}.\nKnownFacts: ${confirmed}\nInferences: ${suspected}\nAction: Analyze and execute optimization.`,
            status: 'QUEUED',
            required_tools: ['FINANCIAL_DATA_READ', 'FINANCIAL_DATA_WRITE'], 
            risk_level: 'MEDIUM',
            max_retries: 1,
            input: { target_gap: gap, action: isReduction ? 'REDUCE' : 'INCREASE' }
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
                console.log("[CFOService] No worker available", assignment.reason);
            } else {
                await supabase.from('tasks').update({ status: 'ASSIGNED', assigned_agent_id: assignment.workerId }).eq('id', task.id);
            }
        } catch(e: any) {
            console.error('[CFOService] Delegate failed:', e.message);
        }
    }
}
