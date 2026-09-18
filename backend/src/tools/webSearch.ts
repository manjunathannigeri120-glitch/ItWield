import { z } from 'zod';
import { Tool, ToolContext } from './Tool';
import { getSearchProvider } from '../services/webSearchProvider';

export class WebSearchTool extends Tool {
  name = 'web_search';
  description = 'Search the web for up-to-date information on any topic.';
  
  schema = z.object({
    query: z.string().describe('The search query to execute')
  });

  async execute(args: any, context: ToolContext): Promise<any> {
    const validated = this.schema.parse(args);
    const provider = getSearchProvider();
    
    try {
      const results = await provider.search(validated.query);
      return { results };
    } catch (error: any) {
      throw new Error(`Web search failed: ${error.message}`);
    }
  }
}
