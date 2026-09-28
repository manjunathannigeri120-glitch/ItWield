import { ensureAIProvider } from '../utils/aiConfig';
import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ExecutiveCapability, ExecutiveRegistry } from './ExecutiveRegistry';
import { ExecutiveDiagnostic, ExecutivePlan, EvaluationResult } from './ExecutiveOperatingContract';

export class CEOCapability implements ExecutiveCapability {
  role: 'CEO' = 'CEO';
  availability: 'AVAILABLE' = 'AVAILABLE';
  supportedObjectives = ['COMPANY_STRATEGY', 'BUSINESS_GROWTH', 'COMPANY_HEALTH', 'STRATEGIC_PRIORITY', 'CROSS_FUNCTIONAL', 'BUSINESS_OUTCOME', 'RESOURCE_ALLOCATION', 'EXECUTIVE_COORDINATION'];

  async loadDomainContext(supabase: SupabaseClient, workspaceId: string): Promise<Record<string, any>> {
    const { data: activeGoals } = await supabase.from('business_goals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ACTIVE');
      
    const { data: bottlenecks } = await supabase.from('business_bottlenecks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ACTIVE');

    const { data: memories } = await supabase.from('company_memory')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('category', 'FACT');

    const executiveStates = activeGoals ? activeGoals.map((g: any) => ({
      goalId: g.id,
      objective: g.objective,
      role: ExecutiveRegistry.getCapabilityForObjective(g.objective)?.role || 'UNKNOWN'
    })) : [];

    return { 
        activeGoals: activeGoals || [], 
        bottlenecks: bottlenecks || [],
        companyContext: (memories || []).map((m: any) => m.title + ': ' + m.content),
        executiveStates
    };
  }

  async evaluateMetrics(supabase: SupabaseClient, workspaceId: string, goal: any): Promise<{ metrics: Record<string, any>, verificationCriteria: string }> {
    return {
      metrics: { },
      verificationCriteria: 'Company strategy aligned and delegated.'
    };
  }

  async diagnose(goal: any, metrics: Record<string, any>, context: Record<string, any>): Promise<ExecutiveDiagnostic> {
    const diagnosticPrompt = `
      You are the CEO of the company.
      Objective: ${goal.objective}
      Active Goals/Executive States: ${JSON.stringify(context.executiveStates || [])}
      Active Bottlenecks: ${JSON.stringify(context.bottlenecks || [])}
      Company Facts: ${JSON.stringify(context.companyContext || [])}

      Identify KNOWN_FACTS, INFERENCES, and INSUFFICIENT_DATA.
      Determine the current bottleneck across the company.
      DO NOT fabricate facts or company health. If you lack data, say so in insufficientData.

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

    ensureAIProvider();
      const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173' } });
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
      const diagRes = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: diagnosticPrompt }], response_format: { type: 'json_object' } });
      diagnostic = JSON.parse(diagRes.choices[0].message.content!.trim());
    } catch(e) {
      console.warn('[CEOCapability] Diagnostic failed.');
    }
    return diagnostic;
  }

  async generatePlan(goal: any, diagnostic: ExecutiveDiagnostic, metrics: Record<string, any>): Promise<ExecutivePlan> {
    const planPrompt = `
      You are the CEO determining the strategic plan and coordinating executives.
      Goal: ${goal.objective}
      Diagnostic: ${JSON.stringify(diagnostic)}
      
      Determine what the company should do next.
      If a specific department must handle a problem, create a coordination action (e.g., actionType: "DELEGATE", authorityRequired: "AUTONOMOUS").
      Do NOT execute specialized actions yourself (e.g. do not fix a website, delegate to CTO).
      If founder approval is needed for a major strategic shift, use APPROVAL_REQUIRED.
      
      Return JSON:
      {
        "objective": "Strategic objective",
        "strategy": "Overall strategy",
        "actions": [
          {
            "actionType": "DELEGATE | OBSERVE | EXTERNAL_COMMUNICATION | PRIORITIZE",
            "purpose": "Purpose",
            "authorityRequired": "OBSERVE | RECOMMEND | APPROVAL_REQUIRED | AUTONOMOUS",
            "reversibility": "READ_ONLY | REVERSIBLE | FINANCIAL | STRATEGIC",
            "verificationMethod": "How to verify"
          }
        ],
        "verification_method": "Strategy implementation",
        "authority_requirements": ["AUTONOMOUS"],
        "expected_effect": "Coordination",
        "risks": [],
        "missing_data": [],
        "current_state": "Determined priority",
        "bottleneck": "Cross-functional",
        "evidence": [],
        "target_outcome": "Delegated"
      }
    `;
    let parsedPlan: any = { objective: '', strategy: '', actions: [], verification_method: '', authority_requirements: [], expected_effect: '', risks: [], missing_data: [], current_state: '', bottleneck: '', evidence: [], target_outcome: '' };
    try {

    ensureAIProvider();
      const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173' } });
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
      const planRes = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: planPrompt }], response_format: { type: 'json_object' } });
      const generated = JSON.parse(planRes.choices[0].message.content!.trim());
      parsedPlan = { ...parsedPlan, ...generated };
    } catch(e) {}
    return parsedPlan as ExecutivePlan;
  }

  async evaluateExecution(metrics: Record<string, any>, goal: any, plan: any): Promise<EvaluationResult> {
     return { status: 'OUTCOME_UNCHANGED', evidence: [], reason: 'Delegated' };
  }
}

