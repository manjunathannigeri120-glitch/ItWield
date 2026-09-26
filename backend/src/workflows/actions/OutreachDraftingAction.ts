import { Action, ActionContext } from './Action';
import { ProviderFactory } from '../../ai/providerFactory';

export class OutreachDraftingAction implements Action {
  id = 'OUTREACH_DRAFTING';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { supabase, workspaceId } = context;
    if (!supabase) throw new Error('Supabase required');
    const missionId = config.mission_id; 

    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('stage', ['RESEARCHED', 'QUALIFIED'])
      .limit(5);

    if (missionId) {
      query = query.eq('mission_id', missionId);
    }

    const { data: opportunities, error } = await query;
    if (error) throw error;

    if (!opportunities || opportunities.length === 0) {
      return { success: true, message: 'No opportunities pending outreach drafting.', draftedCount: 0 };
    }

    const provider = ProviderFactory.getInstance();
    let draftedCount = 0;

    for (const opp of opportunities) {
      if (!opp.contact_email && !opp.website) {
         await supabase.from('opportunities').update({ stage: 'DISMISSED', description: 'No website or email available to draft outreach.' }).eq('id', opp.id);
         continue;
      }

      const prompt = `You are an expert sales development representative.
Draft a highly personalized, professional outreach email for the following prospect.
Company: ${opp.company_name}
Website: ${opp.website || 'N/A'}
Evidence / Match Reason: ${JSON.stringify(opp.evidence)}

Do not invent facts, product claims, or relationships.
Output strictly JSON matching this schema:
{
  "subject": "Email subject",
  "body": "Email body (plain text)",
  "recipient": "recipient@example.com (guess a role-based email if none provided e.g. hello@domain)",
  "reason_for_contact": "Brief internal explanation of why this email is relevant"
}`;

      try {
        const messages = [
           { role: 'system' as 'system', content: 'You are a professional B2B SDR.' },
           { role: 'user' as 'user', content: prompt }
        ];
        const result = await provider.generateText(messages, 'openrouter/free', 0.4, undefined, { type: 'json_object' });

        const draft = JSON.parse(result.text);

        await supabase.from('opportunities').update({
           stage: 'OUTREACH_DRAFTED',
           outreach_draft: {
             ...draft,
             generated_at: new Date().toISOString()
           },
           contact_email: opp.contact_email || draft.recipient
        }).eq('id', opp.id);

        await supabase.from('approvals').insert({
           workspace_id: workspaceId,
           action: 'EXTERNAL_COMMUNICATION',
           title: 'Send Outreach: ' + opp.company_name,
           reason: draft.reason_for_contact || 'Drafted personalized outreach',
           requested_by_executive: 'AI CMO',
           risk_level: 'high',
           status: 'PENDING_APPROVAL',
           expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
           payload: { opportunity_id: opp.id, draft }
        });

        draftedCount++;
      } catch (err: any) {
        console.error('[OutreachDraftingAction] Failed to draft for opp', opp.id, err);
      }
    }

    return { success: true, draftedCount };
  }
}
