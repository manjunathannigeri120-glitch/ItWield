import { ensureAIProvider } from '../utils/aiConfig';
import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { CompanyMemoryService } from './CompanyMemoryService';

export class BusinessBottleneckService {
  static async evaluateBottlenecks(supabase: SupabaseClient, workspaceId: string, activeGoals: any[]): Promise<void> {
    if (!activeGoals || activeGoals.length === 0) return;

    // Load available data
    const { count: prospectsCount } = await supabase.from('opportunities').select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId).eq('stage', 'RESEARCHED');
    const { count: qualifiedCount } = await supabase.from('opportunities').select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId).eq('stage', 'QUALIFIED');
    const { count: contactedCount } = await supabase.from('opportunities').select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId).in('stage', ['CONTACTED', 'NEGOTIATING']);
    const { count: convertedCount } = await supabase.from('opportunities').select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId).eq('stage', 'CONVERTED');

    const businessData = { prospects: prospectsCount, qualified: qualifiedCount, contacted: contactedCount, converted: convertedCount };
    
    // Check Company Brain for context
    const { data: memoryRecords } = await supabase.from('company_memory')
      .select('title, content')
      .eq('workspace_id', workspaceId);

    ensureAIProvider();

    const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY || 'mock', baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'ItWield Bottleneck Engine' } });
    
    for (const goal of activeGoals) {
      const prompt = `
      You are the ItWield Business Bottleneck Engine.
      Active Goal: ${goal.objective} (Target: ${goal.target || 'N/A'} ${goal.target_metric || ''})
      Current Metric: ${goal.current_metric || 0}
      
      Available Data:
      ${JSON.stringify(businessData)}
      
      Company Context:
      ${memoryRecords ? memoryRecords.map((r: any) => `${r.title}: ${r.content}`).join('\n') : 'None'}
      
      Identify the current bottleneck.
      Distinguish KNOWN FACT from INFERENCE from INSUFFICIENT_DATA.
      Never fabricate a bottleneck. If data is lacking, report INSUFFICIENT_DATA.
      
      Respond in JSON:
      {
        "has_bottleneck": true|false,
        "category": "e.g., CUSTOMER_ACQUISITION, CUSTOMER_CONVERSION, DATA_GAP, RESOURCE_CONSTRAINT",
        "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
        "evidence": "What factual evidence supports this?",
        "confidence": 0.0 to 1.0,
        "explanation": "Brief explanation",
        "missing_data": ["any data needed"],
        "recommended_actions": [{"type": "ACTION_TYPE", "description": "What to do next"}]
      }
      `;

      try {
        const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
        const response = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } });
        const text = response.choices[0].message.content!.trim().replace(/^```json/, '').replace(/```$/, '').trim();
        const analysis = JSON.parse(text);

        if (analysis.has_bottleneck && analysis.confidence > 0.5) {
          await this.upsertBottleneck(supabase, workspaceId, goal.id, analysis);
        }
      } catch (e) {
        console.error('[BottleneckEngine] Failed to evaluate bottleneck for goal', goal.id, e);
      }
    }
  }

  private static async upsertBottleneck(supabase: SupabaseClient, workspaceId: string, goalId: string, analysis: any) {
    const { data: existing } = await supabase.from('business_bottlenecks').select('id')
      .eq('workspace_id', workspaceId).eq('related_goal_id', goalId).eq('status', 'DETECTED').maybeSingle();
      
    if (existing) {
      await supabase.from('business_bottlenecks').update({
        severity: analysis.severity, 
        evidence: analysis.evidence, 
        explanation: analysis.explanation, 
        confidence: analysis.confidence,
        recommended_actions: analysis.recommended_actions, 
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      await supabase.from('business_bottlenecks').insert({
        workspace_id: workspaceId,
        related_goal_id: goalId,
        category: analysis.category,
        severity: analysis.severity,
        evidence: analysis.evidence,
        confidence: analysis.confidence,
        explanation: analysis.explanation,
        recommended_actions: analysis.recommended_actions,
        status: 'DETECTED'
      });
      
      // Log to Decision Trace
      await supabase.from('decision_traces').insert({
        workspace_id: workspaceId,
        event_name: 'BOTTLENECK_DETECTED',
        context_data: { category: analysis.category, severity: analysis.severity, evidence: analysis.evidence },
        conclusion: analysis.explanation,
        proposed_action: analysis.recommended_actions[0]?.description || 'None',
        authorization_state: 'SYSTEM_DETECTED',
        result: 'Logged bottleneck for COO review'
      });
      
      await CompanyMemoryService.recordLesson(
        workspaceId,
        `Discovered Bottleneck: ${analysis.category}`,
        analysis.explanation,
        goalId,
        'COO',
        'STRATEGIC_CONTEXT',
        { evidence: analysis.evidence },
        supabase
      );
    }
  }
}

