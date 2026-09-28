import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ExecutiveCapability } from './ExecutiveRegistry';
import { ExecutiveDiagnostic, ExecutivePlan, EvaluationResult } from './ExecutiveOperatingContract';

export class CTOCapability implements ExecutiveCapability {
  role: 'CTO' = 'CTO';
  availability: 'AVAILABLE' = 'AVAILABLE';
  supportedObjectives = ['TECHNICAL_HEALTH', 'BUG_FIX', 'INCIDENT_RESPONSE', 'WEBSITE_HEALTH', 'API_HEALTH'];

  async loadDomainContext(supabase: SupabaseClient, workspaceId: string): Promise<Record<string, any>> {
    // Technical memory
    const { data: memories } = await supabase.from('company_memory')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('category', ['TECHNICAL_CONTEXT', 'LESSON', 'FACT']);
      
    // Recent failed workflows
    const { data: failedWorkflows } = await supabase.from('workflow_runs')
      .select('*, workflows(name)')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(5);

    // Active incidents
    const { data: activeIncidents } = await supabase.from('incidents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['DETECTED', 'INVESTIGATING']);
    
    const memoryContext = (memories || []).map((m: any) => m.title + ': ' + m.content);
    return { companyContext: memoryContext, availableBusinessData: ['workflow_runs', 'incidents'], failedWorkflows, activeIncidents };
  }

  async evaluateMetrics(supabase: SupabaseClient, workspaceId: string, goal: any): Promise<{ metrics: Record<string, any>, verificationCriteria: string }> {
    const { count: failedWorkflowCount } = await supabase.from('workflow_runs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');
      
    const { count: activeIncidentCount } = await supabase.from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .in('status', ['DETECTED', 'INVESTIGATING']);

    return {
      metrics: { failedWorkflowCount, activeIncidentCount },
      verificationCriteria: 'Zero active critical technical incidents and workflow failures resolved.'
    };
  }

  async diagnose(goal: any, metrics: Record<string, any>, context: Record<string, any>): Promise<ExecutiveDiagnostic> {
    const diagnosticPrompt = `
      You are the CTO evaluating technical health and incidents.
      Objective: ${goal.objective}
      Failed Workflows: ${metrics.failedWorkflowCount || 0}
      Active Incidents: ${metrics.activeIncidentCount || 0}
      Recent Failed Workflows: ${JSON.stringify(context.failedWorkflows || [])}
      Recent Incidents: ${JSON.stringify(context.activeIncidents || [])}
      Technical Context: ${(context.companyContext || []).join(', ')}

      Analyze the current state.
      Identify KNOWN_FACTS, INFERENCES, and INSUFFICIENT_DATA based strictly on the provided evidence.
      Determine the current bottleneck.
      DO NOT fabricate facts. Do not claim an incident is resolved if there is no evidence.

      Return ONLY valid JSON matching:
      {
        "knownFacts": ["..."],
        "inferences": ["..."],
        "insufficientData": ["..."],
        "currentBottleneck": "..."
      }
    `;

    let diagnostic: ExecutiveDiagnostic = { knownFacts: [], inferences: [], insufficientData: [], currentBottleneck: 'Unknown' };
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173' } });
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
      const diagRes = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: diagnosticPrompt }], response_format: { type: 'json_object' } });
      diagnostic = JSON.parse(diagRes.choices[0].message.content!.trim());
    } catch(e) {
      console.warn('[CTOCapability] Diagnostic failed, using fallback.');
    }
    return diagnostic;
  }

  async generatePlan(goal: any, diagnostic: ExecutiveDiagnostic, metrics: Record<string, any>): Promise<ExecutivePlan> {
    const planPrompt = `
      You are the CTO creating a structured technical remediation plan.
      Goal: ${goal.objective}
      Diagnostic: ${JSON.stringify(diagnostic)}
      
      Generate an execution plan. Action types must map to existing capabilities.
      Valid action types: DATA_TRANSFORMATION, EXTERNAL_COMMUNICATION, OBSERVE.
      If a fix requires code or infrastructure changes, authority must be APPROVAL_REQUIRED and you must use OBSERVE or EXTERNAL_COMMUNICATION to notify the founder.
      If it is a transient error (like a workflow failure), you can attempt a safe retry (though mapped to a safe worker task).
      
      Return JSON:
      {
        "objective": "Plan objective",
        "strategy": "Strategy summary",
        "actions": [
          {
            "actionType": "DATA_TRANSFORMATION | OBSERVE | EXTERNAL_COMMUNICATION",
            "purpose": "Purpose",
            "authorityRequired": "OBSERVE | RECOMMEND | EXECUTE | AUTONOMOUS | EMERGENCY | APPROVAL_REQUIRED",
            "reversibility": "READ_ONLY | REVERSIBLE | EXTERNAL_COMMUNICATION | FINANCIAL",
            "verificationMethod": "How to verify"
          }
        ]
      }
    `;
    let parsedPlan: any = { objective: '', strategy: '', actions: [] };
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173' } });
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
      const planRes = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: planPrompt }], response_format: { type: 'json_object' } });
      parsedPlan = JSON.parse(planRes.choices[0].message.content!.trim());
    } catch(e) {
      console.warn('[CTOCapability] Plan generation failed.');
    }
    return parsedPlan as ExecutivePlan;
  }

  async evaluateExecution(metrics: Record<string, any>, goal: any, plan: any): Promise<EvaluationResult> {
     const hasFailed = plan.mission_plan_steps?.some((s: any) => s.status === 'FAILED');
     const isComplete = plan.mission_plan_steps?.every((s: any) => ['COMPLETED', 'SKIPPED'].includes(s.status));
     
     if (hasFailed || isComplete) {
       return {
         status: (metrics.activeIncidentCount === 0 && metrics.failedWorkflowCount === 0) ? 'OUTCOME_IMPROVED' : 'OUTCOME_UNCHANGED',
         evidence: [`Active Incidents: ${metrics.activeIncidentCount}`, `Failed Workflows: ${metrics.failedWorkflowCount}`],
         reason: hasFailed ? 'Steps failed' : 'Plan exhausted'
       };
     }
     
     return { status: 'OUTCOME_UNCHANGED', evidence: [], reason: 'Executing' };
  }
}
