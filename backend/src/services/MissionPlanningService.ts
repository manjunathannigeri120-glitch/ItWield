import { SupabaseClient } from '@supabase/supabase-js';
import { AuthorizationRegistry } from './AuthorizationRegistry';

export interface PlanStepDef {
    title: string;
    description: string;
    step_type: string;
    worker_role: string;
    authorization_class: string;
    success_criteria?: string;
}

export class MissionPlanningService {
    
    /**
     * Retrieves the active plan for a mission, or creates a default deterministic one if none exists.
     */
    static async getOrCreateActivePlan(supabase: SupabaseClient, workspaceId: string, missionId: string, missionType: string): Promise<any> {
        // 1. Find ACTIVE plan
        const { data: plans, error: planErr } = await supabase
            .from('mission_plans')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('mission_id', missionId)
            .in('status', ['ACTIVE'])
            .order('created_at', { ascending: false })
            .limit(1);

        if (planErr) throw planErr;

        if (plans && plans.length > 0) {
            const plan = plans[0];
            const { data: steps } = await supabase
                .from('mission_plan_steps')
                .select('*')
                .eq('plan_id', plan.id)
                .order('step_order', { ascending: true });
            
            return { plan, steps: steps || [] };
        }

        // 2. No active plan exists. Create deterministic baseline for known types.
        let defaultSteps: PlanStepDef[] = [];
        let objective = 'Execute mission steps sequentially.';

        if (missionType === 'GET_CUSTOMERS') {
            defaultSteps = [
                { title: 'Identify ICP', description: 'Identify target ideal customer profile', step_type: 'DATA_TRANSFORMATION', worker_role: 'service_role', authorization_class: 'DATA_TRANSFORMATION' },
                { title: 'Research prospects', description: 'Find prospects matching the ICP', step_type: 'LEAD_RESEARCH', worker_role: 'service_role', authorization_class: 'LEAD_RESEARCH' },
                { title: 'Qualify prospects', description: 'Qualify prospects against criteria', step_type: 'LEAD_RESEARCH', worker_role: 'service_role', authorization_class: 'LEAD_RESEARCH' },
                { title: 'Verify evidence', description: 'Verify evidence and URLs', step_type: 'LEAD_RESEARCH', worker_role: 'service_role', authorization_class: 'LEAD_RESEARCH' },
                { title: 'Deduplicate prospects', description: 'Remove duplicate prospects', step_type: 'DATA_TRANSFORMATION', worker_role: 'service_role', authorization_class: 'DATA_TRANSFORMATION' },
                { title: 'Prioritize qualified prospects', description: 'Rank prospects', step_type: 'DATA_TRANSFORMATION', worker_role: 'service_role', authorization_class: 'DATA_TRANSFORMATION' },
                { title: 'Draft Outreach', description: 'Draft personalized outreach email', step_type: 'OUTREACH_DRAFTING', worker_role: 'service_role', authorization_class: 'OUTREACH_DRAFTING' },
                { title: 'Await Approval / Execute Approved Outreach', description: 'Wait for owner to approve drafted emails and execute them', step_type: 'AWAIT_OUTREACH_APPROVALS', worker_role: 'service_role', authorization_class: 'DATA_TRANSFORMATION' }
            ];
            objective = 'Standard execution plan for acquiring customers through research, qualification, and automated outreach.';
        } else {
            // Generic fallback plan
            defaultSteps = [
                { title: 'Execute Mission', description: 'Execute generic mission tasks', step_type: 'WEB_RESEARCH', worker_role: 'service_role', authorization_class: 'WEB_RESEARCH' }
            ];
        }

        return this.createPlan(supabase, workspaceId, missionId, objective, defaultSteps);
    }

    /**
     * Safely transitions the active plan for a mission to CANCELLED and returns it.
     */
    static async cancelActivePlan(supabase: SupabaseClient, workspaceId: string, missionId: string): Promise<any> {
        const { data, error } = await supabase
            .from('mission_plans')
            .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
            .eq('workspace_id', workspaceId)
            .eq('mission_id', missionId)
            .eq('status', 'ACTIVE')
            .select()
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return data || null;
    }

    /**
     * Creates a new plan and validates steps against AuthorizationRegistry
     */
    static async createPlan(supabase: SupabaseClient, workspaceId: string, missionId: string, objective: string, stepsDef: PlanStepDef[]): Promise<any> {
        // Validate Authorization
        for (const s of stepsDef) {
            const authResult = AuthorizationRegistry.authorize(s.authorization_class, {});
            // If the registry explicitly prohibits it (e.g. CHANGE_PRICING returns unauthorized and isn't just approval required)
            if (!authResult.authorized && !authResult.requiresApproval) {
                // To be exact: AuthorizationRegistry returns authorized: false for permanently blocked actions.
                // We must reject immediately if it's completely unauthorized (not just lacking a dynamic permission).
                // Actually, permanently blocked returns authorized: false, requiresApproval: false.
                throw new Error(`Plan generation rejected: step contains prohibited authorization class ${s.authorization_class}`);
            }
        }

        // Determine the next version
        const { data: maxVersionData, error: maxVersionErr } = await supabase
            .from('mission_plans')
            .select('version')
            .eq('workspace_id', workspaceId)
            .eq('mission_id', missionId)
            .order('version', { ascending: false })
            .limit(1);

        let nextVersion = 1;
        if (!maxVersionErr && maxVersionData && maxVersionData.length > 0) {
            nextVersion = maxVersionData[0].version + 1;
        }

        const { data: plan, error: planErr } = await supabase
            .from('mission_plans')
            .insert({
                mission_id: missionId,
                workspace_id: workspaceId,
                status: 'ACTIVE',
                version: nextVersion,
                objective
            })
            .select()
            .single();

        if (planErr) throw planErr;

        let currentDependsOn = null;
        const insertedSteps = [];

        for (let i = 0; i < stepsDef.length; i++) {
            const s = stepsDef[i];
            const { data: step, error: stepErr }: any = await supabase
                .from('mission_plan_steps')
                .insert({
                    plan_id: plan.id,
                    mission_id: missionId,
                    workspace_id: workspaceId,
                    step_order: i + 1,
                    title: s.title,
                    description: s.description,
                    step_type: s.step_type,
                    status: i === 0 ? 'READY' : 'PENDING',
                    worker_role: s.worker_role,
                    authorization_class: s.authorization_class,
                    success_criteria: s.success_criteria || null,
                    depends_on_step_id: currentDependsOn
                })
                .select()
                .single();
            
            if (stepErr) throw stepErr;
            insertedSteps.push(step);
            currentDependsOn = step.id; // strictly sequential dependency for baseline
        }

        return { plan, steps: insertedSteps };
    }

    /**
     * Determines which step should run next, updating statuses if necessary.
     */
    static async evaluatePlanState(supabase: SupabaseClient, workspaceId: string, plan: any, steps: any[]): Promise<{ readyStep: any | null, isComplete: boolean }> {
        // Find if we have any FAILED or BLOCKED
        const blocked = steps.find(s => s.status === 'BLOCKED' || s.status === 'FAILED');
        if (blocked) return { readyStep: null, isComplete: false };

        const running = steps.find(s => s.status === 'RUNNING');
        if (running) return { readyStep: null, isComplete: false };

        // Find first non-completed
        const nextPending = steps.find(s => ['PENDING', 'READY'].includes(s.status));
        if (!nextPending) {
            return { readyStep: null, isComplete: true };
        }

        // Ensure it's marked READY
        if (nextPending.status === 'PENDING') {
            const { data } = await supabase.from('mission_plan_steps').update({ status: 'READY', updated_at: new Date().toISOString() }).eq('id', nextPending.id).select().single();
            return { readyStep: data, isComplete: false };
        }

        return { readyStep: nextPending, isComplete: false };
    }

    /**
     * Marks a step as RUNNING.
     */
    static async markStepRunning(supabase: SupabaseClient, stepId: string): Promise<void> {
        await supabase.from('mission_plan_steps').update({ status: 'RUNNING', updated_at: new Date().toISOString() }).eq('id', stepId);
    }

    /**
     * Marks a step as COMPLETED.
     */
    static async completeStep(supabase: SupabaseClient, stepId: string): Promise<void> {
        await supabase.from('mission_plan_steps').update({ status: 'COMPLETED', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', stepId);
    }

    /**
     * Marks a plan as COMPLETED.
     */
    static async completePlan(supabase: SupabaseClient, planId: string): Promise<void> {
        await supabase.from('mission_plans').update({ status: 'COMPLETED', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', planId);
    }
}

