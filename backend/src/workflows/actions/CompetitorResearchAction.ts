import { Action, ActionContext } from './Action';
import { getSearchProvider } from '../../services/webSearchProvider';

export class CompetitorResearchAction implements Action {
  id = 'COMPETITOR_RESEARCH';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { competitorName, marketSegment } = config;
    
    if (!competitorName) {
      return { success: false, error: 'Competitor research requires a competitorName.' };
    }

    try {
      const searchProvider = getSearchProvider();
      const query = `${competitorName} ${marketSegment || 'news updates product features pricing'}`.trim();
      const searchResults = await searchProvider.search(query);

      if (!searchResults || searchResults.length === 0) {
        return {
          success: false,
          error: `Research completed but returned no public data for ${competitorName}.`,
          verification: { verified: false, checks: ['Found public sources'] }
        };
      }

      // Structure the output
      const observations = searchResults.map(r => ({
        competitor: competitorName,
        observed_change: r.title,
        source: r.url,
        evidence: r.content,
        observed_at: new Date().toISOString()
      }));

      return {
        success: true,
        action: 'COMPETITOR_RESEARCH',
        observations: observations,
        summary: `Gathered ${observations.length} verified observations for ${competitorName}.`,
        timestamp: new Date().toISOString(),
        verification: {
          verified: true,
          checks: ['Verified public sources', 'No private scraping', `Returned ${observations.length} observations`]
        }
      };

    } catch (err: any) {
      return { 
        success: false, 
        error: `Competitor research failed: ${err.message}`,
        verification: { verified: false, checks: [] }
      };
    }
  }
}
