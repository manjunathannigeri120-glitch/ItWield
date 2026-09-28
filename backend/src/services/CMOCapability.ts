import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ExecutiveCapability } from './ExecutiveRegistry';
import { ExecutiveDiagnostic, ExecutivePlan, EvaluationResult } from './ExecutiveOperatingContract';

export class CMOCapability implements ExecutiveCapability {
  role: 'CMO' = 'CMO';
  availability: 'AVAILABLE' = 'AVAILABLE';
  supportedObjectives = ['GET_CUSTOMERS', 'CUSTOMER_ACQUISITION', 'MARKETING_GROWTH'];

  async loadDomainContext(supabase: SupabaseClient, workspaceId: string): Promise<Record<string, any>> {
    const { data: memories } = await supabase.from('company_memory')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('category', ['STRATEGIC_CONTEXT', 'FACT']);
    
    const memoryContext = (memories || []).map((m: any) => m.title + ': ' + m.content);
    return { companyContext: memoryContext, availableBusinessData: ['opportunities'] };
  }

  async evaluateMetrics(supabase: SupabaseClient, workspaceId: string, goal: any): Promise<{ metrics: Record<string, any>, verificationCriteria: string }> {
    const { count: convertedCount } = await supabase.from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('stage', 'CONVERTED');

    const { count: totalOpps } = await supabase.from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    return {
      metrics: { convertedCount, totalOpps },
      verificationCriteria: 'CONVERTED opportunities'
    };
  }

  async diagnose(goal: any, metrics: Record<string, any>, context: Record<string, any>): Promise<ExecutiveDiagnostic> {
    const diagnosticPrompt = `
      You are the CMO evaluating customer acquisition.
      Objective: ${goal.objective}
      Current Verified Progress: ${metrics.convertedCount || 0} / ${goal.target} CONVERTED opportunities
      Total Opportunities: ${metrics.totalOpps || 0}
      Company Context: ${(context.companyContext || []).join(', ')}
      Existing Bottlenecks: ${(context.bottlenecks || []).map((b: any) => b.explanation).join(', ')}

      Analyze the current state.
      Identify KNOWN_FACTS, INFERENCES, and INSUFFICIENT_DATA.
      Determine the current bottleneck.
      DO NOT fabricate facts.

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
      console.warn('[CMOCapability] Diagnostic failed, using fallback.');
    }
    return diagnostic;
  }

  async generatePlan(goal: any, diagnostic: ExecutiveDiagnostic, metrics: Record<string, any>): Promise<ExecutivePlan> {
    const planPrompt = `
      You are the CMO creating a structured customer acquisition plan.
      Goal: ${goal.objective}
      Current CONVERTED: ${metrics.convertedCount || 0}
      Diagnostic: ${JSON.stringify(diagnostic)}
      
      Generate an execution plan. Action types must map to existing capabilities:
      LEAD_RESEARCH, DATA_TRANSFORMATION, OUTREACH_DRAFTING, APPROVAL, EXTERNAL_COMMUNICATION.
      
      Return JSON:
      {
        "objective": "Plan objective",
        "strategy": "Strategy summary",
        "actions": [
          {
            "actionType": "LEAD_RESEARCH | DATA_TRANSFORMATION | OUTREACH_DRAFTING | APPROVAL | OBSERVE",
            "purpose": "Purpose",
            "authorityRequired": "OBSERVE | RECOMMEND | EXECUTE | AUTONOMOUS | EMERGENCY",
            "reversibility": "READ_ONLY | REVERSIBLE | EXTERNAL_COMMUNICATION | FINANCIAL",
            "verificationMethod": "How to verify"
          }
        ]
      }
    `;
    const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173' } });
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
    const planRes = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: planPrompt }], response_format: { type: 'json_object' } });
    return JSON.parse(planRes.choices[0].message.content!.trim()) as ExecutivePlan;
  }

  async evaluateExecution(metrics: Record<string, any>, goal: any, plan: any): Promise<EvaluationResult> {
     const hasFailed = plan.mission_plan_steps?.some((s: any) => s.status === 'FAILED');
     const isComplete = plan.mission_plan_steps?.every((s: any) => ['COMPLETED', 'SKIPPED'].includes(s.status));
     
     if (hasFailed || isComplete) {
       return {
         status: (metrics.convertedCount && metrics.convertedCount > (goal.current_metric || 0)) ? 'OUTCOME_IMPROVED' : 'OUTCOME_UNCHANGED',
         evidence: [`Converted moved to ${metrics.convertedCount}`],
         reason: hasFailed ? 'Steps failed' : 'Plan exhausted'
       };
     }
     
     return { status: 'OUTCOME_UNCHANGED', evidence: [], reason: 'Executing' };
  }
}
