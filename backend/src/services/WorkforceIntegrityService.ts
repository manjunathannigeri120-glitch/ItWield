import { SupabaseClient } from '@supabase/supabase-js';
import { CapabilityRegistry, CapabilityDefinition } from './CapabilityRegistry';
import { AuthorizationRegistry } from './AuthorizationRegistry';

export interface WorkforceValidationResult {
  valid: boolean;
  status: 'VALID' | 'MISSING_CAPABILITY' | 'UNKNOWN_CAPABILITY' | 'MISCONFIGURED_WORKER' | 'CONNECTION_REQUIRED' | 'AUTHORIZATION_REQUIRED' | 'PROHIBITED';
  reason: string;
  capability?: CapabilityDefinition;
}

export class WorkforceIntegrityService {
  /**
   * Validate if a worker can perform an action, BEFORE task assignment.
   */
  static async validateAssignment(
    supabase: SupabaseClient, 
    workspaceId: string, 
    agentId: string, 
    actionId: string,
    permissions: Record<string, boolean> = {}
  ): Promise<WorkforceValidationResult> {
    
    // 1. Is action recognized in capability registry?
    const canonicalActionId = CapabilityRegistry.normalize(actionId);
    let requiredCapId = CapabilityRegistry.getRequiredCapabilityForAction(canonicalActionId);
    
    // Fallback: If it's not explicitly in CapabilityRegistry, check if it's a known action.
    if (!requiredCapId && actionId !== 'WORKFLOW_EXECUTION' && actionId !== 'UNKNOWN') {
      const authDef = AuthorizationRegistry.authorize(actionId).definition;
      if (!authDef) {
         return { valid: false, status: 'UNKNOWN_CAPABILITY', reason: `Action/Capability '${actionId}' is not registered.` };
      }
      requiredCapId = canonicalActionId;
    } else if (!requiredCapId) {
      // Workflows usually don't have a rigid specific capability mapped yet in this model unless predefined
      // For safety, pass through workflows or UNKNOWN if strictly permitted by Auth later, but mark valid capability checks
      requiredCapId = canonicalActionId; 
    }

    const capability = requiredCapId ? CapabilityRegistry.get(requiredCapId) : undefined;

    // 2. Fetch worker and validate declared capabilities
    const { data: worker } = await supabase.from('agents').select('*').eq('id', agentId).single();
    if (!worker) {
      return { valid: false, status: 'MISCONFIGURED_WORKER', reason: `Worker ${agentId} does not exist.` };
    }
    
    if (worker.status === 'blocked') { // Handle predefined manual blocks
        // Pass through to let authorization/system handle it, or we could block here.
    }

    const declaredCaps = (worker.capabilities || []).map((c: string) => CapabilityRegistry.normalize(c));
    if (requiredCapId && requiredCapId !== 'WORKFLOW_EXECUTION' && requiredCapId !== 'UNKNOWN') {
       if (!declaredCaps.includes(requiredCapId)) {
         return { valid: false, status: 'MISSING_CAPABILITY', reason: `Worker '${worker.name}' missing required capability: ${requiredCapId}. Declared: ${declaredCaps.join(', ')}` };
       }
    }

    // 3. Connection Validation
    const authResult = AuthorizationRegistry.authorize(actionId, permissions);
    const reqConn = authResult.definition?.requiredConnection || capability?.requiredConnection;
    
    if (reqConn) {
      if (reqConn === 'web_search') {
        if (!process.env.TAVILY_API_KEY && process.env.NODE_ENV !== 'test') {
          return { valid: false, status: 'CONNECTION_REQUIRED', reason: `Missing ${reqConn} API configuration.`, capability };
        }
      } else {
        const { data: conn } = await supabase.from('connections').select('status').eq('workspace_id', workspaceId).eq('provider', reqConn).single();
        if (!conn || conn.status === 'disconnected' || conn.status === 'error') {
          return { valid: false, status: 'CONNECTION_REQUIRED', reason: `Worker needs an active ${reqConn} connection to execute ${actionId}.`, capability };
        }
      }
    }

    // 4. Authorization Validation
    if (!authResult.authorized) {
      if (authResult.requiresApproval) {
        return { valid: false, status: 'AUTHORIZATION_REQUIRED', reason: authResult.reason, capability };
      }
      return { valid: false, status: 'PROHIBITED', reason: authResult.reason, capability };
    }

    return { valid: true, status: 'VALID', reason: 'Worker is fully capable and authorized.', capability };
  }

  /**
   * Evaluates the readiness of the entire workforce.
   */
  static async evaluateWorkforceReadiness(supabase: SupabaseClient, workspaceId: string): Promise<any[]> {
    const { data: agents } = await supabase.from('agents').select('*').eq('workspace_id', workspaceId);
    const { data: tasks } = await supabase.from('tasks').select('assigned_agent_id, status').eq('workspace_id', workspaceId).in('status', ['PENDING', 'RUNNING']);
    const { data: conns } = await supabase.from('connections').select('provider, status').eq('workspace_id', workspaceId);

    const activeConns = (conns || []).filter((c:any) => c.status === 'connected').map((c:any) => c.provider);

    return (agents || []).map(agent => {
      const activeTask = tasks?.find(t => t.assigned_agent_id === agent.id);
      
      const declared = (agent.capabilities || []);
      const validated: string[] = [];
      const missingConns: string[] = [];
      const invalid: string[] = [];

      declared.forEach((capRaw: string) => {
        const canonical = CapabilityRegistry.normalize(capRaw);
        const def = CapabilityRegistry.get(canonical);
        if (!def) {
          // It's a legacy or misspelled capability without a canonical match
          invalid.push(capRaw);
        } else {
          if (def.requiredConnection && def.requiredConnection !== 'web_search' && !activeConns.includes(def.requiredConnection)) {
            missingConns.push(def.requiredConnection);
          } else {
            validated.push(canonical);
          }
        }
      });

      let state = 'READY';
      let reason = 'Worker is ready.';

      if (invalid.length > 0) {
        state = 'MISCONFIGURED';
        reason = `Unknown or deprecated capabilities: ${invalid.join(', ')}`;
      } else if (missingConns.length > 0) {
        state = 'BLOCKED';
        reason = `Missing connections for capabilities: ${missingConns.join(', ')}`;
      } else if (activeTask) {
        state = 'WORKING';
        reason = `Executing task.`;
      } else if (agent.status === 'blocked') {
        state = 'BLOCKED';
        reason = 'Worker manually blocked or disabled.';
      } else if (validated.length === 0 && declared.length > 0) {
        state = 'MISCONFIGURED';
        reason = 'All declared capabilities are invalid or disconnected.';
      } else if (declared.length === 0 && !['CEO', 'CTO', 'CMO', 'CFO'].includes(agent.role || '')) {
         // Executives might not have explicit capability array
         state = 'IDLE';
         reason = 'No capabilities configured.';
      } else {
         state = 'READY';
      }

      return {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        capabilities: {
          declared,
          validated,
          invalid,
          missingConns
        },
        state,
        reason,
        currentTask: activeTask ? activeTask.status : null
      };
    });
  }

  static async findCapableWorker(supabase: SupabaseClient, workspaceId: string, actionId: string): Promise<any | null> {
    const canonicalActionId = CapabilityRegistry.normalize(actionId);
    const requiredCapId = CapabilityRegistry.getRequiredCapabilityForAction(canonicalActionId) || canonicalActionId;

    const { data: agents } = await supabase.from('agents').select('*').eq('workspace_id', workspaceId);
    if (!agents) return null;

    for (const agent of agents) {
        const declared = (agent.capabilities || []).map((c: string) => CapabilityRegistry.normalize(c));
        if (declared.includes(requiredCapId)) {
            return agent;
        }
    }
    return null;
  }
}
