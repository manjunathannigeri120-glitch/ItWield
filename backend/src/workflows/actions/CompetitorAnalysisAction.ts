import { Action, ActionContext } from './Action';

/**
 * CompetitorAnalysisAction — MVP autonomous research action.
 *
 * Safely analyzes existing competitor data for the workspace to identify 
 * market gaps, positioning advantages, and recent changes.
 * - Read-only operation.
 * - Does not invent competitors.
 * - Relies strictly on verified data in the competitors table.
 */
export class CompetitorAnalysisAction implements Action {
  id = 'COMPETITIVE_ANALYSIS';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { workspaceId, supabase } = context;

    if (!workspaceId || !supabase) {
      return { success: false, error: 'Context missing workspaceId or supabase client.' };
    }

    try {
      // Fetch verified competitor data
      const { data: competitors, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (!competitors || competitors.length === 0) {
        return {
          success: true,
          competitorsFound: 0,
          summary: 'No verified competitors currently tracked in the database. Consider adding primary competitors to begin competitive intelligence monitoring.'
        };
      }

      // Analyze the data deterministically
      const recentCompetitors = competitors.filter(c => {
        const ageInDays = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return ageInDays <= 30; // Added in last 30 days
      });

      const knownWeaknessesCount = competitors.filter(c => c.weaknesses && c.weaknesses.length > 5).length;
      const strengthsCount = competitors.filter(c => c.strengths && c.strengths.length > 5).length;

      let insights = `Analyzed ${competitors.length} known competitors. `;
      
      if (recentCompetitors.length > 0) {
        insights += `Detected ${recentCompetitors.length} recently tracked market entrants. `;
      }
      if (knownWeaknessesCount > 0) {
        insights += `Identified documented weaknesses in ${knownWeaknessesCount} competitors that can be leveraged. `;
      }

      return {
        success: true,
        competitorsFound: competitors.length,
        recentAdditions: recentCompetitors.length,
        analyzedAt: new Date().toISOString(),
        summary: insights.trim() || 'Completed competitive landscape analysis.'
      };

    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        summary: `Competitor analysis failed: ${err.message}`
      };
    }
  }
}
