import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export interface BusinessGoalInterpretation {
  intent_type: 'OUTCOME' | 'INVESTIGATION' | 'RESEARCH' | 'ANALYSIS' | 'GENERAL' | 'ACTION' | 'PLANNING' | 'MONITORING';
  scope: 'OWN_COMPANY' | 'GENERAL' | 'EXTERNAL_BUSINESS' | 'MIXED';
  request_type: 'QUESTION' | 'RESEARCH' | 'ANALYSIS' | 'INVESTIGATION' | 'OUTCOME' | 'ACTION' | 'PLANNING' | 'MONITORING';
  objective: string;
  target?: number;
  target_metric?: string;
  timeframe?: string;
  success_definition: string;
  required_company_context: string[]; 
  missing_company_context: string[];
  external_information_required: string[];
  website_required: boolean;
  reason: string;
  confidence: number;
  constraints?: string[];
  required_data_integrations?: string[];
}

export class BusinessGoalInterpreter {
  static async interpretGoal(
    supabase: SupabaseClient, 
    workspaceId: string, 
    rawInput: string, 
    companyMemorySummary: any
  ): Promise<BusinessGoalInterpretation> {
    const openai = new OpenAI({ 
      apiKey: process.env.OPENROUTER_API_KEY || 'mock', 
      baseURL: 'https://openrouter.ai/api/v1', 
      defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ItWield Interpreter' } 
    });
    
    // Convert companyMemorySummary to a readable list of what is known
    const knownKeys = Object.keys(companyMemorySummary);
    const knownContextString = knownKeys.length > 0 
        ? JSON.stringify(companyMemorySummary, null, 2)
        : 'NONE (Brand new workspace)';

    const prompt = `
      You are the ItWield Business Command Interpreter.
      The founder has given a natural language business request: "${rawInput}"
      
      Already Known Company Brain Context:
      ${knownContextString}
      
      RULES FOR CONTEXT CLASSIFICATION:
      1. DO NOT request "website" if the requested action does not strictly require it (e.g. general questions).
      2. DO NOT request "website" if sufficient company context already exists in Company Brain to fulfill the request.
      3. DO NOT request DUPLICATE information (if industry is known, don't ask for it).
      4. "website_required" MUST be FALSE if the website is already in the Company Brain OR if it's not strictly needed for this request.
      5. Scope classification:
         - OWN_COMPANY: e.g. "Get me 20 customers", "Analyze my sales", "Reduce my costs"
         - GENERAL: e.g. "What is CAC?", "How do SaaS companies reduce churn?"
         - EXTERNAL_BUSINESS: e.g. "Find new markets for my company"
         - MIXED: e.g. "Look at my company and tell me what market to enter"

      Determine the required missing context.
      
      Return ONLY valid JSON matching this schema:
      {
        "intent_type": "OUTCOME | INVESTIGATION | RESEARCH | ANALYSIS | GENERAL | ACTION | PLANNING | MONITORING",
        "scope": "OWN_COMPANY | GENERAL | EXTERNAL_BUSINESS | MIXED",
        "request_type": "QUESTION | RESEARCH | ANALYSIS | INVESTIGATION | OUTCOME | ACTION | PLANNING | MONITORING",
        "objective": "High level objective translated from user input",
        "target": numeric target or null,
        "target_metric": "What is measured (if applicable)",
        "timeframe": "Explicit timeframe or null",
        "success_definition": "Precise definition of success",
        "required_company_context": ["List of all context fields the task requires to run"],
        "missing_company_context": ["List of fields strictly required but missing from Company Brain. Do NOT include fields already in Company Brain."],
        "external_information_required": ["External data sources strictly required (e.g. 'financial_data', 'competitor_data')"],
        "website_required": boolean,
        "reason": "Deterministic justification for why context/website is required or not.",
        "confidence": 0.95
      }
    `;

    try {
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
      const response = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
      const text = response.choices[0].message.content!.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      return JSON.parse(text) as BusinessGoalInterpretation;
    } catch (e: any) {
      console.error('[BusinessGoalInterpreter] Failed to interpret goal:', e);
      return {
        intent_type: 'OUTCOME',
        scope: 'OWN_COMPANY',
        request_type: 'OUTCOME',
        objective: rawInput,
        success_definition: 'Manual verification required',
        required_company_context: [],
        missing_company_context: [],
        external_information_required: [],
        website_required: false,
        reason: 'Fallback due to error',
        confidence: 0,
        required_data_integrations: []
      };
    }
  }

  static async createGoal(supabase: SupabaseClient, workspaceId: string, rawInput: string, interpretation?: BusinessGoalInterpretation): Promise<any> {
    const normalizedInput = rawInput.trim();
    
    // Deduplicate: check for identical ACTIVE goal by raw_input
    const { data: existingGoals, error: checkError } = await supabase
      .from('business_goals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ACTIVE')
      .ilike('raw_input', normalizedInput)
      .limit(1);

    if (!checkError && existingGoals && existingGoals.length > 0) {
      return existingGoals[0];
    }
    
    if (!interpretation) {
       interpretation = await this.interpretGoal(supabase, workspaceId, rawInput, {});
    }

    // For purely general questions, mark goal as COMPLETED immediately or handle differently.
    // We will just mark it as ACTIVE for now, and the COO can resolve it, or we handle it in API.
    const isGeneral = interpretation.scope === 'GENERAL';

    const { data: goal, error } = await supabase
      .from('business_goals')
      .insert({
        workspace_id: workspaceId,
        raw_input: rawInput.trim(),
        objective: interpretation.objective,
        target: interpretation.target || null,
        target_metric: interpretation.target_metric || null,
        timeframe: interpretation.timeframe || null,
        success_definition: interpretation.success_definition,
        required_data: interpretation.external_information_required || [],
        missing_data: [],
        constraints: interpretation.constraints || [],
        status: isGeneral ? 'COMPLETED' : 'ACTIVE' // Mark general questions as completed if handled inline? Let's keep it ACTIVE and let Planner handle it.
      })
      .select()
      .single();
      
    if (error) throw error;
    
    await supabase.from('decision_traces').insert({
      workspace_id: workspaceId,
      event_name: 'GOAL_CREATED',
      context_data: { rawInput, intent: interpretation.intent_type, scope: interpretation.scope },
      conclusion: `Interpreted request as ${interpretation.intent_type} [${interpretation.scope}]: ${interpretation.objective}`,
      proposed_action: isGeneral ? 'Direct response generated.' : 'Proceed to Outcome Planning',
      authorization_state: 'OWNER_DIRECTED',
      result: `Goal ID: ${goal.id}`
    });

    return goal;
  }
}
