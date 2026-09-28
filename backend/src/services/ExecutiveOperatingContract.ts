export interface ExecutiveAction {
  actionType: string;
  purpose: string;
  inputs: Record<string, any>;
  expectedOutput: string;
  authorityRequired: 'OBSERVE' | 'RECOMMEND' | 'EXECUTE' | 'AUTONOMOUS' | 'EMERGENCY';
  reversibility: 'READ_ONLY' | 'REVERSIBLE' | 'EXTERNAL_COMMUNICATION' | 'FINANCIAL' | 'DESTRUCTIVE' | 'SECURITY_SENSITIVE' | 'IRREVERSIBLE';
  verificationMethod: string;
}

export interface ExecutivePlan {
  objective: string;
  current_state: string;
  bottleneck: string;
  evidence: string[];
  target_outcome: string;
  strategy: string;
  actions: ExecutiveAction[];
  expected_effect: string;
  verification_method: string;
  authority_requirements: string[];
  risks: string[];
  missing_data: string[];
}

export interface ExecutiveDiagnostic {
  knownFacts: string[];
  inferences: string[];
  insufficientData: string[];
  currentBottleneck: string;
}

export interface EvaluationResult {
  status: 'OUTCOME_IMPROVED' | 'OUTCOME_UNCHANGED' | 'OUTCOME_WORSENED' | 'INSUFFICIENT_DATA' | 'BLOCKED';
  evidence: string[];
  reason: string;
}

export interface ExecutiveOperatingContract {
  workspaceId: string;
  executiveRole: 'CEO' | 'CTO' | 'CMO' | 'CFO' | 'COO';
  goalId: string;
  missionId?: string;
  objective: string;
  successCriteria: string;
  companyContext: Record<string, any>;
  availableBusinessData: string[];
  currentMetrics: Record<string, any>;
  diagnostic: ExecutiveDiagnostic;
  authorityLevel: string;
  plan?: ExecutivePlan;
  verificationCriteria: string;
  currentStatus: 'CREATED' | 'CONTEXT_LOADING' | 'DIAGNOSING' | 'PLANNING' | 'AWAITING_AUTHORITY' | 'EXECUTING' | 'VERIFYING' | 'EVALUATING' | 'COMPLETED' | 'BLOCKED' | 'REPLAN_REQUIRED' | 'ESCALATED';
  evidence: string[];
  blockers: string[];
  nextAction: string;
  replanRequired: boolean;
  founderNotificationRequired: boolean;
}
