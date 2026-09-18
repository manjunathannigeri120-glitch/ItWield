import { z } from 'zod';
import { Tool, ToolContext } from './Tool';
import OpenAI from 'openai';
import { supabase } from '../db/supabase';

export class KnowledgeSearchTool extends Tool {
  name = 'knowledge_search';
  description = 'Search internal documents. Use this when the user asks about specific company knowledge, documentation, or uploaded files.';
  
  schema = z.object({
    query: z.string().describe('The search query or question.')
  });

  async execute(args: any, context: ToolContext): Promise<any> {
    const { query } = this.schema.parse(args);
    
    try {
      if (!context.workspaceId || !context.runId) {
        return { error: 'Missing execution context.' };
      }

      // To securely call the RPC, we need the agent_id. 
      // The context has `runId`. We can fetch `agent_id` from `agent_runs`.
      const { data: run } = await supabase!
        .from('agent_runs')
        .select('agent_id')
        .eq('id', context.runId)
        .single();
        
      if (!run || !run.agent_id) {
         return { error: 'Could not determine agent identity for authorization.' };
      }
      
      const agentId = run.agent_id;

      if (!process.env.OPENAI_API_KEY) {
        return { 
          result: `[Mock Search Result] In a real environment, this would search the vector database for "${query}". Currently running in mock mode.`,
          source: 'Mock Knowledge Base'
        };
      }

      // Generate embedding for query
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const embeddingRes = await openai.embeddings.create({
        model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
        input: query,
        encoding_format: "float",
      });
      const queryEmbedding = embeddingRes.data[0].embedding;

      // Search vector DB securely via RPC (enforces agent KB assignment)
      const { data: chunks, error } = await supabase!.rpc('match_document_chunks', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: 0.3, // Require at least some similarity
        match_count: 5,       // Top 5 chunks
        p_agent_id: agentId
      });

      if (error) {
        console.error('Vector search error:', error);
        return { error: 'Failed to query vector database.' };
      }

      if (!chunks || chunks.length === 0) {
        return { result: 'No relevant information found in the assigned Knowledge Bases.' };
      }

      // Format results with citations
      const contextStrs = chunks.map((c: any, index: number) => `--- Result ${index + 1} | Source: ${c.document_name} ---\n${c.content}`);
      
      return { 
        result: contextStrs.join('\n\n'),
        chunks_found: chunks.length
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}
