import { Action, ActionContext } from './Action';
import { getSearchProvider } from '../../services/webSearchProvider';

export class WebResearchAction implements Action {
  id = 'WEB_RESEARCH';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { query, objective } = config;
    if (!query) {
      return { success: false, error: 'Web research requires a query parameter.' };
    }

    try {
      const searchProvider = getSearchProvider();
      const results = await searchProvider.search(query);

      if (!results || results.length === 0) {
        return {
          success: false,
          error: 'Search completed but returned no results.',
          verification: { verified: false, checks: ['Result count > 0'] }
        };
      }

      // Basic summarization or extraction (in a real system we'd use LLM to summarize based on the objective, but here we just return the factual results)
      const summary = `Found ${results.length} sources for query: "${query}". Objective: ${objective || 'General research'}.`;
      
      return {
        success: true,
        action: 'WEB_RESEARCH',
        summary,
        results: results.slice(0, 5).map(r => ({
          title: r.title,
          url: r.url,
          content: r.content
        })),
        timestamp: new Date().toISOString(),
        verification: {
          verified: true,
          checks: ['Search successfully executed', `Returned ${results.length} valid sources`]
        }
      };

    } catch (err: any) {
      return { 
        success: false, 
        error: `Web research failed: ${err.message}`,
        verification: { verified: false, checks: [] }
      };
    }
  }
}
