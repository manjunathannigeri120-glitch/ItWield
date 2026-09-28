import { SupabaseClient } from '@supabase/supabase-js';
import { AuthorizationRegistry } from './AuthorizationRegistry';
import { CapabilityRegistry } from './CapabilityRegistry';

export type AuthorityLevel = 'AUTONOMOUS' | 'RECOMMEND' | 'APPROVAL_REQUIRED' | 'BLOCKED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActorType = 'EXECUTIVE' | 'WORKER' | 'SYSTEM' | 'FOUNDER';
export type OperatingState = 'OPERATING' | 'PAUSED' | 'WAITING_FOR_FOUNDER' | 'STOPPED';

export interface ActionRequest {
    workspaceId: string;
    actor: string;
    actorType: ActorType;
    executiveRole?: string;
    workerId?: string;
    objectiveId?: string;
    missionId?: string;
    system: string;
    capability: string;
    action: string;
    requestedAuthority: AuthorityLevel;
    inputSummary?: string;
}

export interface AuthorizationResult {
    actor: string;
    actorType: ActorType;
    system: string;
    capability: string;
    action: string;
    requestedAuthority: AuthorityLevel;
    effectiveAuthority: AuthorityLevel;
    riskLevel: RiskLevel;
    policyDecision: string;
    authorized: boolean;
}

export class ControlLayerService {

    static classifyRisk(system: string, capability: string, action: string): RiskLevel {
        const normalized = capability.toLowerCase();
        
        // CRITICAL
        if (normalized.includes('payment') || normalized.includes('billing') || normalized.includes('delete') || action.includes('PRODUCTION_DEPLOYMENT') || action.includes('FINANCIAL_ACTION') || action.includes('CHANGE_PRICING')) {
            return 'CRITICAL';
        }
        // HIGH
        if (normalized.includes('write') && system.toLowerCase() === 'github' || action.includes('EXTERNAL_COMMUNICATION') || action.includes('MAJOR_PRODUCT_CHANGE')) {
            return 'HIGH';
        }
        // MEDIUM
        if (normalized.includes('update') || normalized.includes('create') || action.includes('STORE_BUSINESS_DATA')) {
            return 'MEDIUM';
        }
        // LOW
        return 'LOW';
    }

    static resolveAuthority(req: ActionRequest, riskLevel: RiskLevel): AuthorityLevel {
        // Fallbacks for dangerous actions
        if (riskLevel === 'CRITICAL') return 'APPROVAL_REQUIRED';
        
        // Permanent blocked check
        const auth = AuthorizationRegistry.authorize(req.action, {});
        if (!auth.authorized && !auth.requiresApproval) {
            return 'BLOCKED';
        }

        if (auth.requiresApproval || riskLevel === 'HIGH') {
            return 'APPROVAL_REQUIRED';
        }

        // Executives have higher baseline authority
        if (req.actorType === 'EXECUTIVE') {
            if (riskLevel === 'LOW' || riskLevel === 'MEDIUM') return 'AUTONOMOUS';
        }

        // Workers default to autonomous for low, but might need approval for medium
        if (req.actorType === 'WORKER') {
            if (riskLevel === 'LOW') return 'AUTONOMOUS';
            return 'APPROVAL_REQUIRED';
        }

        return 'APPROVAL_REQUIRED';
    }

    static async authorizeAction(supabase: SupabaseClient, req: ActionRequest): Promise<AuthorizationResult> {
        
        // 1. Check workspace operating state
        const { data: ws } = await supabase.from('workspaces').select('operating_state').eq('id', req.workspaceId).single();
        if (ws?.operating_state === 'PAUSED' || ws?.operating_state === 'STOPPED') {
            return {
                actor: req.actor, actorType: req.actorType, system: req.system, capability: req.capability, action: req.action,
                requestedAuthority: req.requestedAuthority, effectiveAuthority: 'BLOCKED', riskLevel: 'LOW',
                policyDecision: 'Workspace is currently ' + ws.operating_state,
                authorized: false
            };
        }

        // 2. Classify Risk
        const riskLevel = this.classifyRisk(req.system, req.capability, req.action);

        // 3. Resolve Authority
        const effectiveAuthority = this.resolveAuthority(req, riskLevel);

        const authorized = effectiveAuthority === 'AUTONOMOUS' && (req.requestedAuthority === 'AUTONOMOUS' || req.requestedAuthority === 'RECOMMEND');
        
        let policyDecision = 'Action allowed under ' + effectiveAuthority + ' authority.';
        if (effectiveAuthority === 'BLOCKED') policyDecision = 'Action is blocked by system policy.';
        if (effectiveAuthority === 'APPROVAL_REQUIRED') policyDecision = 'Action requires founder approval.';

        return {
            actor: req.actor,
            actorType: req.actorType,
            system: req.system,
            capability: req.capability,
            action: req.action,
            requestedAuthority: req.requestedAuthority,
            effectiveAuthority,
            riskLevel,
            policyDecision,
            authorized
        };
    }

    static async requestApproval(supabase: SupabaseClient, req: ActionRequest, authResult: AuthorizationResult, reason: string, expectedEffect: string): Promise<any> {
        const { data: approval } = await supabase.from('approvals').insert({
            workspace_id: req.workspaceId,
            objective_id: req.objectiveId,
            mission_id: req.missionId,
            actor: req.actor,
            actor_type: req.actorType,
            requested_action: req.action,
            action: req.action, // Legacy
            title: 'Approval Request: ' + req.action,
            system: req.system,
            capability: req.capability,
            reason: reason,
            requested_by_executive: req.actor,
            expected_effect: expectedEffect,
            risk_level: authResult.riskLevel,
            status: 'PENDING_APPROVAL',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }).select().single();
        return approval;
    }

    static async recordAudit(supabase: SupabaseClient, req: ActionRequest, authResult: AuthorizationResult, resultSummary?: string, evidence?: string, failureInfo?: string): Promise<void> {
        
        // Redact secrets conceptually
        const safeInput = req.inputSummary?.replace(/(sk-[a-zA-Z0-9]{20,})|(password[:=]\S+)/g, '[REDACTED]');
        
        await supabase.from('action_audit_logs').insert({
            workspace_id: req.workspaceId,
            actor: req.actor,
            actor_type: req.actorType,
            executive_role: req.executiveRole,
            worker_id: req.workerId,
            objective_id: req.objectiveId,
            mission_id: req.missionId,
            system: req.system,
            capability: req.capability,
            action: req.action,
            authority: authResult.effectiveAuthority,
            policy_decision: authResult.policyDecision,
            risk_level: authResult.riskLevel,
            input_summary: safeInput,
            result_summary: resultSummary,
            evidence: evidence,
            verification_state: failureInfo ? 'REJECTED' : (evidence ? 'VERIFIED' : 'UNVERIFIED'),
            failure_information: failureInfo
        });
    }

    static async setOperatingState(supabase: SupabaseClient, workspaceId: string, state: OperatingState): Promise<void> {
        await supabase.from('workspaces').update({ operating_state: state }).eq('id', workspaceId);
    }
}
