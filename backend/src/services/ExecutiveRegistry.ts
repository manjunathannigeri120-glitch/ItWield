import { SupabaseClient } from '@supabase/supabase-js';
import { ExecutiveDiagnostic, ExecutivePlan, EvaluationResult } from './ExecutiveOperatingContract';

export interface ExecutiveCapability {
  role: 'CEO' | 'COO' | 'CMO' | 'CTO' | 'CFO';
  availability: 'AVAILABLE' | 'LIMITED' | 'RECOMMENDATION_ONLY' | 'DISABLED' | 'UNAVAILABLE' | 'PLANNED';
  supportedObjectives: string[];

  loadDomainContext(supabase: SupabaseClient, workspaceId: string): Promise<Record<string, any>>;
  evaluateMetrics(supabase: SupabaseClient, workspaceId: string, goal: any): Promise<{ metrics: Record<string, any>, verificationCriteria: string }>;
  diagnose(goal: any, metrics: Record<string, any>, context: Record<string, any>): Promise<ExecutiveDiagnostic>;
  generatePlan(goal: any, diagnostic: ExecutiveDiagnostic, metrics: Record<string, any>): Promise<ExecutivePlan>;
  evaluateExecution(metrics: Record<string, any>, goal: any, plan: any): Promise<EvaluationResult>;
}

export class StubCapability implements ExecutiveCapability {
  role: 'CEO' | 'COO' | 'CMO' | 'CTO' | 'CFO';
  availability: 'PLANNED' = 'PLANNED';
  supportedObjectives: string[] = [];

  constructor(role: 'CEO' | 'COO' | 'CMO' | 'CTO' | 'CFO') {
    this.role = role;
  }

  async loadDomainContext() { return {}; }
  async evaluateMetrics() { return { metrics: {}, verificationCriteria: 'Pending' }; }
  async diagnose(): Promise<ExecutiveDiagnostic> { return { knownFacts: [], inferences: [], insufficientData: [], currentBottleneck: 'Unknown' }; }
  async generatePlan(): Promise<ExecutivePlan> { return { objective: '', strategy: '', actions: [], verification_method: '', authority_requirements: [], expected_effect: '', risks: [], missing_data: [], current_state: '', bottleneck: '', evidence: [], target_outcome: '' }; }
  async evaluateExecution(): Promise<EvaluationResult> { return { status: 'INSUFFICIENT_DATA', evidence: [], reason: 'Not implemented' }; }
}

export class ExecutiveRegistry {
  private static capabilities: Map<string, ExecutiveCapability> = new Map();

  static register(capability: ExecutiveCapability) {
    this.capabilities.set(capability.role, capability);
  }

  static getCapability(role: string): ExecutiveCapability | undefined {
    return this.capabilities.get(role);
  }

  static getCapabilityForObjective(objectiveInput: string, intent?: string): ExecutiveCapability | null {
    const objLower = objectiveInput.toLowerCase();
    
    if (objLower.includes('customer') || objLower.includes('marketing') || objLower.includes('acquisition') || objLower.includes('sales')) {
      return this.capabilities.get('CMO') || null;
    }
    if (objLower.includes('technical') || objLower.includes('bug') || objLower.includes('incident') || objLower.includes('website') || objLower.includes('reliability') || objLower.includes('api') || objLower.includes('backend') || objLower.includes('database') || objLower.includes('workflow') || objLower.includes('worker') || objLower.includes('deployment') || objLower.includes('error') || objLower.includes('failure')) {
      return this.capabilities.get('CTO') || null;
    }
    if (objLower.includes('cost reduction') || objLower.includes('financial') || objLower.includes('cash flow') || objLower.includes('margin')) {
      return this.capabilities.get('CFO') || null;
    }
    if (objLower.includes('cross company') || objLower.includes('strategic') || objLower.includes('operations')) {
      return this.capabilities.get('CEO') || null;
    }
    
    return null;
  }
}

