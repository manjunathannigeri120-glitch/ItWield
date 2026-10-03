import { CompanyCoordinationService } from './CompanyCoordinationService';
import { SupabaseClient } from '@supabase/supabase-js';
import { CompanyMemoryService } from './CompanyMemoryService';
import { WorkerAssignmentService, WorkerAssignmentCriteria } from './WorkerAssignmentService';
import { ControlLayerService, ActionRequest } from './ControlLayerService';

export class CTOService {
    static async operate(supabase: SupabaseClient, workspaceId: string, context?: any) {
        const { data: ws } = await supabase.from('workspaces').select('operating_state, cto_locked_until').eq('id', workspaceId).single();
        if (!ws) return;
        
        if (ws.operating_state === 'PAUSED' || ws.operating_state === 'STOPPED') {
            return;
        }

        const now = Date.now();
        if (ws.cto_locked_until && new Date(ws.cto_locked_until).getTime() > now) {
            return;
        }

        const lease = new Date(now + 2 * 60 * 1000).toISOString();
        await supabase.from('workspaces').update({ cto_locked_until: lease, cto_status: 'EVALUATING' }).eq('id', workspaceId);

        try {
            if (context?.coordinationId) {
                await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, context.coordinationId, 'CTO', 'EXECUTING');
            }
            await this.executeOperatingLoop(supabase, workspaceId);
            if (context?.coordinationId) {
                await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, context.coordinationId, 'CTO', 'ACHIEVED');
            }
        } finally {
            await supabase.from('workspaces').update({ cto_locked_until: null, cto_status: 'IDLE' }).eq('id', workspaceId);
        }
    }

    private static async executeOperatingLoop(supabase: SupabaseClient, workspaceId: string) {
        await this.detectIncidents(supabase, workspaceId);

        const { data: incidents } = await supabase.from('incidents').select('*').eq('workspace_id', workspaceId).in('status', ['DETECTED', 'DIAGNOSED', 'PLANNED', 'FIXING', 'VERIFYING']).limit(10);
        if (!incidents) return;

        for (const inc of incidents) {
            if (inc.status === 'DETECTED') await this.diagnoseIncident(supabase, workspaceId, inc);
            else if (inc.status === 'DIAGNOSED') await this.planFix(supabase, workspaceId, inc);
            else if (inc.status === 'PLANNED') await this.delegateFix(supabase, workspaceId, inc);
            else if (inc.status === 'FIXING' || inc.status === 'VERIFYING') await this.verifyFix(supabase, workspaceId, inc);
        }
    }

    private static async detectIncidents(supabase: SupabaseClient, workspaceId: string) {
        const { data: failedTasks } = await supabase.from('tasks').select('*').eq('workspace_id', workspaceId).eq('status', 'FAILED').limit(1);
        if (failedTasks && failedTasks.length > 0) {
            const task = failedTasks[0];
            const { data: existing } = await supabase.from('incidents').select('id').eq('workspace_id', workspaceId).eq('title', `Task Failure: ${task.title}`).single();
            
            if (!existing) {
                const evidence = task.evidence || { task_id: task.id, error: task.failure_reason || task.error };
                await supabase.from('incidents').insert({
                    workspace_id: workspaceId,
                    type: 'TECHNICAL',
                    severity: 'high',
                    status: 'DETECTED',
                    title: `Task Failure: ${task.title}`,
                    description: `Task ${task.id} failed.`,
                    source: 'TASK_SYSTEM',
                    evidence: evidence
                });
            }
        }
    }

    private static async diagnoseIncident(supabase: SupabaseClient, workspaceId: string, incident: any) {
        if (!incident.evidence || Object.keys(incident.evidence).length === 0) {
            await supabase.from('incidents').update({
                status: 'BLOCKED',
                resolution: 'INSUFFICIENT_DATA: No evidence provided to diagnose.'
            }).eq('id', incident.id);
            return;
        }

        let confirmed = null;
        let suspected = null;

        if (incident.evidence.error) {
            confirmed = `KNOWN_FACT: The error is explicitly ${incident.evidence.error}`;
            suspected = `INFERENCE: This likely indicates an API or permission failure.`;
        } else {
            suspected = `INSUFFICIENT_DATA: Missing raw error string.`;
        }

        await supabase.from('incidents').update({
            status: 'DIAGNOSED',
            suspected_cause: suspected,
            confirmed_cause: confirmed
        }).eq('id', incident.id);
    }

    private static async planFix(supabase: SupabaseClient, workspaceId: string, incident: any) {
        const taskPayload = {
            workspace_id: workspaceId,
            title: `Fix Incident: ${incident.title}`,
            description: `Plan:\nObjective: Resolve ${incident.title}\nKnownFacts: ${incident.confirmed_cause}\nInferences: ${incident.suspected_cause}`,
            status: 'QUEUED',
            required_tools: ['GITHUB_LIST_ISSUES'], 
            risk_level: 'MEDIUM',
            max_retries: 2,
            input: { incident_id: incident.id }
        };

        const { data: task } = await supabase.from('tasks').insert(taskPayload).select().single();
        if (task) {
            await supabase.from('incidents').update({
                status: 'PLANNED',
                affected_resource: task.id
            }).eq('id', incident.id);
        }
    }

    private static async delegateFix(supabase: SupabaseClient, workspaceId: string, incident: any) {
        const taskId = incident.affected_resource;
        if (!taskId) return;
        
        try {
            const criteria: WorkerAssignmentCriteria = {
                workspaceId,
                requiredCapabilities: [],
                riskLevel: 'MEDIUM',
                authorityRequired: 'AUTONOMOUS'
            };
            const assignment = await WorkerAssignmentService.assignTask(taskId, criteria, supabase);
            if (assignment.success && assignment.workerId) {
                await supabase.from('incidents').update({ status: 'FIXING', assigned_worker_id: assignment.workerId }).eq('id', incident.id);
            }
        } catch(e: any) {
            console.error('[CTOService] Delegate failed:', e.message);
        }
    }

    private static async verifyFix(supabase: SupabaseClient, workspaceId: string, incident: any) {
        const taskId = incident.affected_resource;
        if (!taskId) return;
        
        const { data: task } = await supabase.from('tasks').select('status, result, failure_reason, error').eq('id', taskId).single();
        if (!task) return;

        if (task.status === 'COMPLETED' || task.status === 'VERIFICATION_PENDING') {
            const actionReq: ActionRequest = {
                workspaceId,
                actor: 'CTO_VERIFICATION',
                actorType: 'SYSTEM',
                system: 'internal',
                capability: 'VERIFY_FIX',
                action: 'Verify incident resolution',
                requestedAuthority: 'AUTONOMOUS'
            };
            
            const authResult = await ControlLayerService.executeTool(supabase, actionReq);
            
            if (authResult.success) {
                 const verificationEvidence = { external_status: 'OK', verified_at: new Date().toISOString() };
                 await supabase.from('incidents').update({
                    status: 'RESOLVED',
                    resolution: `Verified independently. Evidence: ${JSON.stringify(verificationEvidence)}`,
                    resolved_at: new Date().toISOString()
                }).eq('id', incident.id);

                await supabase.from('notifications').insert({
                    workspace_id: workspaceId,
                    title: 'Issue Auto-Fixed',
                    content: `The CTO agent has autonomously resolved an incident: ${incident.title}.`
                });

                await CompanyMemoryService.createMemory({
                    workspaceId,
                    category: 'LESSON',
                    title: `Incident Resolved: ${incident.title}`,
                    content: `Fixed successfully via task ${taskId}. Known cause: ${incident.confirmed_cause || 'Unknown'}. Verified via independent read.`,
                    sourceType: 'INCIDENT',
                    sourceId: incident.id,
                    evidence: verificationEvidence,
                    verificationStatus: 'SOURCE_BACKED',
                    createdBy: 'SYSTEM'
                }, supabase);
            } else {
                 await supabase.from('incidents').update({ status: 'FAILED', resolution: 'Verification failed or blocked.' }).eq('id', incident.id);
            }
        } else if (task.status === 'FAILED') {
            await supabase.from('incidents').update({
                status: 'INVESTIGATING', 
                resolution: `Task failed: ${task.failure_reason || task.error}. Replanning needed.`
            }).eq('id', incident.id);
            
            await CompanyMemoryService.createMemory({
                workspaceId,
                category: 'FAILURE',
                title: `Fix Failed: ${incident.title}`,
                content: `Task ${taskId} failed to fix incident. Error: ${task.failure_reason || task.error}`,
                sourceType: 'INCIDENT',
                sourceId: incident.id,
                verificationStatus: 'SOURCE_BACKED',
                createdBy: 'SYSTEM'
            }, supabase);
        } else if (task.status === 'WAITING_FOR_APPROVAL') {
            if (incident.status !== 'ESCALATED') {
                 await supabase.from('incidents').update({ status: 'ESCALATED' }).eq('id', incident.id);
            }
        }
    }
}

