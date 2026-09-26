import { SupabaseClient } from '@supabase/supabase-js';

export interface CompanyState {
    workspaceId: string;
    company: any;
    agents: any[];
    tasks: any[];
    missions: any[];
    pendingApprovals: any[];
    memories: any[];
    incidents: any[];
    opportunities: any[];
    summary: {
        status: string;
        reason: string;
    };
}

export class CompanyStateService {
    static async buildState(supabase: SupabaseClient, workspaceId: string): Promise<CompanyState> {
        const { data: company, error: wsError } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
        if (wsError || !company) throw new Error('Workspace not found');

        const [
            agentsRes, tasksRes, missionsRes, approvalsRes, memoryRes, incidentsRes, opportunitiesRes
        ] = await Promise.all([
            supabase.from('agents').select('*').eq('workspace_id', workspaceId),
            supabase.from('tasks').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20),
            supabase.from('business_missions').select('*, mission_plans(*, mission_plan_steps(*)), mission_progress(*)').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
            supabase.from('approvals').select('*').eq('workspace_id', workspaceId).eq('status', 'PENDING').order('created_at', { ascending: false }),
            supabase.from('company_memory').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(50),
            supabase.from('incidents').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20),
            supabase.from('opportunities').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(20)
        ]);

        const agents = agentsRes.data || [];
        const tasks = tasksRes.data || [];
        const missions = missionsRes.data || [];
        const pendingApprovals = approvalsRes.data || [];
        const memories = memoryRes.data || [];
        const incidents = incidentsRes.data || [];
        const opportunities = opportunitiesRes.data || [];

        // A. Company Status Summary
        const failedTasks = tasks.filter((t: any) => t.status === 'FAILED');
        const blockedMissions = missions.filter((m: any) => m.status === 'PAUSED' || m.status === 'BLOCKED');
        const activeIncidents = incidents.filter((i: any) => i.status === 'ACTIVE' || i.status === 'NEW');

        let status = 'Operating normally';
        let reason = 'All systems healthy';
        
        if (activeIncidents.length > 0) {
            status = 'Needs attention';
            reason = `${activeIncidents.length} active incident(s)`;
        } else if (failedTasks.length > 0) {
            status = 'Needs attention';
            reason = `${failedTasks.length} task(s) failed recently`;
        } else if (blockedMissions.length > 0) {
            status = 'Blocked';
            reason = `${blockedMissions.length} mission(s) blocked`;
        } else if (pendingApprovals.length > 0) {
            status = 'Action required';
            reason = `${pendingApprovals.length} pending approval(s)`;
        }

        return {
            workspaceId,
            company,
            agents,
            tasks,
            missions,
            pendingApprovals,
            memories,
            incidents,
            opportunities,
            summary: { status, reason }
        };
    }
}
