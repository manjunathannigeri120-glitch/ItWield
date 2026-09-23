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
          analysisType: 'COMPETITIVE_ANALYSIS',
          competitorsAnalyzed: [],
          observations: [],
          findings: ['INSUFFICIENT_DATA'],
          recommendations: ['Add primary competitors to the workspace to enable competitive intelligence monitoring.'],
          summary: 'No verified competitors currently tracked in the database.',
          verification: { verified: true, checks: ['database query successful', 'competitor count is 0'] }
        };
      }

      // Format observation list
      const observations = competitors.map(c => `Competitor ${c.name} tracked since ${new Date(c.created_at).toLocaleDateString()}.`);
      const findings = [];
      const recommendations = [];

      const recentCompetitors = competitors.filter(c => {
        const ageInDays = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return ageInDays <= 30; // Added in last 30 days
      });

      if (recentCompetitors.length > 0) {
        findings.push(`Detected ${recentCompetitors.length} recently tracked market entrants or updates.`);
      }

      // Check if we have substantive data
      const hasDetailedData = competitors.some(c => (c.strengths && c.strengths.length > 5) || (c.weaknesses && c.weaknesses.length > 5));

      if (hasDetailedData) {
        findings.push('Substantive competitive intelligence data detected.');
        recommendations.push('Evaluate if NovaDesk AI should address the identical customer need based on competitor features.');
      } else {
        findings.push('INSUFFICIENT_DATA: No detailed strengths or weaknesses found in competitive observations.');
        recommendations.push('Initiate automated web research on these competitors to gather verified features and weaknesses.');
      }

      return {
        success: true,
        analysisType: 'COMPETITIVE_ANALYSIS',
        competitorsAnalyzed: competitors.map(c => c.name),
        observations,
        findings,
        recommendations,
        summary: `Analyzed ${competitors.length} known competitors. Found ${findings.length} patterns.`,
        verification: { verified: true, checks: ['database query successful', `analyzed ${competitors.length} records`] }
      };

    } catch (err: any) {
      return {
        success: false,
        summary: `Analysis failed: ${err.message}`,
        error: err.message,
        verification: { verified: false, checks: ['database query threw an exception'] }
      };
    }
  }
}
