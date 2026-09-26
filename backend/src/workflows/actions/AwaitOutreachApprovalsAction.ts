import { Action, ActionContext } from './Action';

export class AwaitOutreachApprovalsAction implements Action {
  id = 'AWAIT_OUTREACH_APPROVALS';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { supabase, workspaceId } = context;
    if (!supabase) throw new Error('Supabase required');
    const missionId = config.mission_id; 

    let query = supabase
      .from('opportunities')
      .select('stage')
      .eq('workspace_id', workspaceId)
      .in('stage', ['OUTREACH_DRAFTED', 'AWAITING_APPROVAL']);

    if (missionId) {
      query = query.eq('mission_id', missionId);
    }

    const { data: pending, error } = await query;
    if (error) throw error;

    if (pending && pending.length > 0) {
      // Intentionally return false to keep task pending/blocked
      return { success: false, error: 'Awaiting human approval for ' + pending.length + ' outreach drafts.', pendingCount: pending.length };
    }

    return { success: true, message: 'All outreach drafts have been processed.' };
  }
}
