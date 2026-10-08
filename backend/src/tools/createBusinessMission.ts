import { z } from 'zod';
import { Tool, ToolContext } from './Tool';
import { getServiceSupabase } from '../db/supabaseClient';
import { BusinessGoalInterpreter } from '../services/BusinessGoalInterpreter';
import { OutcomePlannerService } from '../services/OutcomePlannerService';

export class CreateBusinessMissionTool extends Tool {
  name = 'CREATE_BUSINESS_MISSION';
  description = 'Create a new business goal or mission for the company (e.g. acquire customers, research competitors, increase revenue, optimize operations). Spawns autonomous missions for executive agents.';

  schema = z.object({
    objective: z.string().describe('The primary business objective to achieve, e.g. "Get 20 customers" or "Find 50 B2B leads"'),
    target: z.string().optional().describe('Optional numerical target, e.g. "20" or "50"')
  });

  async execute(args: any, context: ToolContext): Promise<any> {
    const validated = this.schema.parse(args);
    const supabase = getServiceSupabase();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    const workspaceId = context.workspaceId;
    if (!workspaceId) {
      return { success: false, error: 'No workspace context provided' };
    }

    try {
      const interpretation = await BusinessGoalInterpreter.interpretGoal(
        supabase,
        workspaceId,
        validated.objective,
        {}
      );

      const goal = await BusinessGoalInterpreter.createGoal(
        supabase,
        workspaceId,
        validated.objective,
        interpretation
      );

      const plan = await OutcomePlannerService.planOutcome(
        supabase,
        workspaceId,
        goal.id
      );

      return {
        success: true,
        goal_id: goal.id,
        objective: goal.objective,
        missions_spawned: plan.plan?.missions?.length || 2,
        message: `Successfully created business mission "${goal.objective}". Autonomous executive agents (CMO, CTO, workers) have been dispatched and operations are active.`
      };
    } catch (err: any) {
      console.error('[CreateBusinessMissionTool] Error creating mission:', err);
      return {
        success: false,
        error: err.message || 'Failed to create business mission'
      };
    }
  }
}
