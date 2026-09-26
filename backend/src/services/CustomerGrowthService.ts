import { SupabaseClient } from '@supabase/supabase-js';
import { CompanyMemoryService } from './CompanyMemoryService';
import { MissionLearningService } from './MissionLearningService';

export class CustomerGrowthService {
  
  /**
   * Records a response from a prospect, classifying it and updating the opportunity.
   */
  static async recordResponse(supabase: SupabaseClient, workspaceId: string, oppId: string, responseText: string, classification: string = 'Potential fit') {
    const { data: opp, error } = await supabase.from('opportunities').select('*').eq('id', oppId).eq('workspace_id', workspaceId).single();
    if (error || !opp) throw new Error('Opportunity not found');

    const history = Array.isArray(opp.contact_history) ? opp.contact_history : [];
    history.push({
      type: 'RESPONSE',
      content: responseText,
      timestamp: new Date().toISOString()
    });

    const { data: updated, error: updateError } = await supabase.from('opportunities')
      .update({
        stage: 'RESPONDED',
        response_status: 'RECEIVED',
        ai_classification: classification,
        contact_history: history,
        updated_at: new Date().toISOString()
      })
      .eq('id', oppId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  /**
   * Records a verified conversion (WON or LOST).
   * Automatically generates Company Memory OUTCOME and proposes Mission Learning.
   */
  static async recordConversion(supabase: SupabaseClient, workspaceId: string, oppId: string, outcome: 'WON' | 'LOST', evidence: string, valueStr?: string) {
    const { data: opp, error } = await supabase.from('opportunities').select('*').eq('id', oppId).eq('workspace_id', workspaceId).single();
    if (error || !opp) throw new Error('Opportunity not found');

    const { data: updated, error: updateError } = await supabase.from('opportunities')
      .update({
        stage: outcome,
        evidence: { ...opp.evidence, conversion_evidence: evidence, conversion_value: valueStr },
        updated_at: new Date().toISOString()
      })
      .eq('id', oppId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Generate Company Memory Outcome
    const title = `Opportunity ${outcome}: ${opp.company_name}`;
    const content = `We ${outcome.toLowerCase()} the opportunity with ${opp.company_name}. Evidence: ${evidence}. ${valueStr ? `Value: ${valueStr}` : ''}`;
    
    await CompanyMemoryService.recordOutcome(workspaceId, title, content, opp.id, 'OWNER', undefined, undefined, supabase);

    // Feed Mission Learning Pipeline if this originated from a mission
    if (opp.mission_id && outcome === 'WON') {
      const learning = {
        title: `Conversion Factor: ${opp.company_name}`,
        content: `Prospect converted into a customer. Reason for match was: ${opp.evidence?.reason_for_match || 'Unknown'}.`,
        memory_type: 'OBSERVATION',
        confidence: 'high',
        evidence_summary: evidence,
        source_result_ids: opp.mission_result_id ? [opp.mission_result_id] : [],
        status: 'VERIFIED'
      };
      await MissionLearningService.persistLearnings(supabase, workspaceId, opp.mission_id, [learning]);
    }

    return updated;
  }

  /**
   * Proposes a follow-up action for a stalled opportunity.
   */
  static async proposeFollowUp(supabase: SupabaseClient, workspaceId: string, oppId: string, reason: string) {
    const { data: opp, error } = await supabase.from('opportunities').select('*').eq('id', oppId).eq('workspace_id', workspaceId).single();
    if (error || !opp) throw new Error('Opportunity not found');

    // Rule enforcement could be injected here by retrieving CompanyMemory rules
    // For now, we rely on the owner approval step to enforce final limits
    
    const draft = {
      to: opp.contact_email || opp.company_name,
      subject: `Following up: ${opp.company_name}`,
      body: `Hi team at ${opp.company_name},\n\nI wanted to follow up on our previous outreach regarding ${opp.evidence?.reason_for_match || 'a potential partnership'}.\n\nBest,\nThe AI Team`,
      reason: reason
    };

    const { data: updated } = await supabase.from('opportunities')
      .update({
        follow_up_draft: draft,
        next_action_date: new Date().toISOString()
      })
      .eq('id', oppId)
      .select()
      .single();

    // Create an approval record
    await supabase.from('approvals').insert({
      workspace_id: workspaceId,
      action_type: 'EXTERNAL_COMMUNICATION',
      title: `Approve Follow-up: ${opp.company_name}`,
      reason: reason,
      risk_level: 'high',
      payload: { oppId, draft },
      status: 'PENDING',
      requested_by: 'Customer Growth Engine'
    });

    return updated;
  }
}
