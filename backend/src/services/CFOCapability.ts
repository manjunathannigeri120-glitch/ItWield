import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ExecutiveCapability } from './ExecutiveRegistry';
import { ExecutiveDiagnostic, ExecutivePlan, EvaluationResult } from './ExecutiveOperatingContract';

export class CFOCapability implements ExecutiveCapability {
  role: 'CFO' = 'CFO';
  availability: 'AVAILABLE' = 'AVAILABLE';
  supportedObjectives = ['FINANCIAL_HEALTH', 'CASH_FLOW', 'REVENUE', 'EXPENSES', 'COST_REDUCTION', 'PROFITABILITY', 'MARGIN', 'BUDGET', 'FORECAST', 'FINANCIAL_RISK'];

  async loadDomainContext(supabase: SupabaseClient, workspaceId: string): Promise<Record<string, any>> {
    const { data: memories } = await supabase.from('company_memory')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('category', ['FINANCIAL_CONTEXT', 'LESSON', 'FACT']);
      
    const { data: convertedOpps } = await supabase.from('opportunities')
      .select('value')
      .eq('workspace_id', workspaceId)
      .eq('stage', 'CONVERTED');

    let financialData = [];
    try {
        const { data: bdr } = await supabase.from('business_data_registry')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('domain', 'FINANCE');
        financialData = bdr || [];
    } catch(e) {}
    
    const memoryContext = (memories || []).map((m: any) => m.title + ': ' + m.content);
    return { 
        companyContext: memoryContext, 
        availableBusinessData: ['financial_context', 'opportunities_value'], 
        convertedOpps,
        financialData 
    };
  }

  async evaluateMetrics(supabase: SupabaseClient, workspaceId: string, goal: any): Promise<{ metrics: Record<string, any>, verificationCriteria: string }> {
    return {
      metrics: { },
      verificationCriteria: 'Verified financial data supports the outcome.'
    };
  }

  async diagnose(goal: any, metrics: Record<string, any>, context: Record<string, any>): Promise<ExecutiveDiagnostic> {
    const hasFinancialData = context.financialData && context.financialData.length > 0;
    const hasFinancialMemories = context.companyContext && context.companyContext.length > 0;

    let diagnostic: ExecutiveDiagnostic = { knownFacts: [], inferences: [], insufficientData: [], currentBottleneck: 'Unknown' };

    if (!hasFinancialData && !hasFinancialMemories) {
        diagnostic.insufficientData.push('No verified financial records (revenue, expenses, cash flow) exist in the workspace.');
        diagnostic.currentBottleneck = 'MISSING_FINANCIAL_DATA';
        return diagnostic;
    }

    const diagnosticPrompt = `
      You are the CFO evaluating financial health.
      Objective: ${goal.objective}
      Financial Context: ${(context.companyContext || []).join(', ')}
      Registered Financial Data: ${JSON.stringify(context.financialData || [])}

      Analyze the current state.
      Identify KNOWN_FACTS, INFERENCES, and INSUFFICIENT_DATA strictly based on evidence.
      Determine the current bottleneck.
      DO NOT fabricate facts. Do not invent revenue, expenses, profit, cash, runway, or margins.
      If data is missing, state it in insufficientData.

      Return ONLY valid JSON matching:
      {
        "knownFacts": ["..."],
        "inferences": ["..."],
        "insufficientData": ["..."],
        "currentBottleneck": "..."
      }
    `;

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173' } });
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
      const diagRes = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: diagnosticPrompt }], response_format: { type: 'json_object' } });
      diagnostic = JSON.parse(diagRes.choices[0].message.content!.trim());
    } catch(e) {
      console.warn('[CFOCapability] Diagnostic failed.');
    }
    return diagnostic;
  }

  async generatePlan(goal: any, diagnostic: ExecutiveDiagnostic, metrics: Record<string, any>): Promise<ExecutivePlan> {
    if (diagnostic.currentBottleneck === 'MISSING_FINANCIAL_DATA') {
       return {
         objective: 'Gather financial data',
         strategy: 'Cannot execute financial plans without verified financial data.',
         actions: [],
         verification_method: '',
         authority_requirements: [],
         expected_effect: '',
         risks: [],
         missing_data: [],
         current_state: '',
         bottleneck: '',
         evidence: [],
         target_outcome: ''
       } as ExecutivePlan;
    }

    const planPrompt = `
      You are the CFO creating a structured financial remediation or analysis plan.
      Goal: ${goal.objective}
      Diagnostic: ${JSON.stringify(diagnostic)}
      
      Valid action types: OBSERVE, EXTERNAL_COMMUNICATION, DATA_TRANSFORMATION.
      If it requires changing payments/budget, authority must be APPROVAL_REQUIRED.
      
      Return JSON:
      {
        "objective": "Plan objective",
        "strategy": "Strategy summary",
        "actions": [
          {
            "actionType": "DATA_TRANSFORMATION | OBSERVE | EXTERNAL_COMMUNICATION",
            "purpose": "Purpose",
            "authorityRequired": "OBSERVE | RECOMMEND | APPROVAL_REQUIRED | AUTONOMOUS",
            "reversibility": "READ_ONLY | REVERSIBLE | FINANCIAL",
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
    } catch(e) {}
    return parsedPlan as ExecutivePlan;
  }

  async evaluateExecution(metrics: Record<string, any>, goal: any, plan: any): Promise<EvaluationResult> {
     const hasFailed = plan.mission_plan_steps?.some((s: any) => s.status === 'FAILED');
     const isComplete = plan.mission_plan_steps?.every((s: any) => ['COMPLETED', 'SKIPPED'].includes(s.status));
     
     if (hasFailed || isComplete) {
       return {
         status: 'OUTCOME_UNCHANGED',
         evidence: [],
         reason: hasFailed ? 'Steps failed' : 'Plan exhausted / Data missing'
       };
     }
     
     return { status: 'OUTCOME_UNCHANGED', evidence: [], reason: 'Executing' };
  }
}
