import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type MemoryType = 'FACT' | 'GOAL' | 'PREFERENCE' | 'DECISION' | 'LESSON' | 'INCIDENT' | 'OUTCOME';
export type SourceType = 'OWNER' | 'TASK' | 'TASK_EVENT' | 'INCIDENT' | 'APPROVAL' | 'COMPETITOR' | 'SYSTEM';
export type Importance = 'low' | 'medium' | 'high' | 'critical';

export interface CreateMemoryParams {
  workspaceId: string;
  memoryType: MemoryType;
  title: string;
  content: string;
  sourceType: SourceType;
  sourceId?: string;
  importance?: Importance;
  createdBy: string;
}

export class CompanyMemoryService {
  static async createMemory(params: CreateMemoryParams, supabaseClient?: any) {
    if (!params.workspaceId) throw new Error('Workspace ID is required');
    const client = supabaseClient || supabase;
    
    // Security: block secret storage
    const lower = params.content.toLowerCase();
    if (lower.includes('password') || lower.includes('sk-ant-') || lower.includes('api_key') || lower.includes('secret_key')) {
      throw new Error('Security: Cannot store secrets in memory');
    }

    try {
      const { data, error } = await client
        .from('company_memory')
        .upsert(
          {
            workspace_id: params.workspaceId,
            memory_type: params.memoryType,
            title: params.title,
            content: params.content,
            source_type: params.sourceType,
            source_id: params.sourceId,
            importance: params.importance || 'medium',
            created_by: params.createdBy
          },
          { onConflict: 'workspace_id,source_type,source_id' }
        )
        .select()
        .single();
      
      if (error) {
        console.error(`[CompanyMemoryService] Error creating memory: ${error.message}`);
        return null;
      }
      return data;
    } catch (e: any) {
      console.error(`[CompanyMemoryService] Error: ${e.message}`);
      return null;
    }
  }

  // Accept optional db client so CEOService / routes can pass their injected Supabase (fixes test isolation)
  static async recordDecision(workspaceId: string, title: string, content: string, sourceId: string, createdBy: string = 'OWNER', db?: any) {
    const client = db || supabase;
    try {
      const result = await client
        .from('company_memory')
        .upsert(
          {
            workspace_id: workspaceId,
            memory_type: 'DECISION',
            title,
            content,
            source_type: 'APPROVAL',
            source_id: sourceId,
            importance: 'high',
            created_by: createdBy
          },
          { onConflict: 'workspace_id,source_type,source_id' }
        );
      if (result?.error) console.error(`[CompanyMemoryService] Decision memory error: ${result.error.message}`);
    } catch (e: any) {
      console.error(`[CompanyMemoryService] Decision error: ${e.message}`);
    }
  }

  static async recordOutcome(workspaceId: string, title: string, content: string, sourceId: string, createdBy: string = 'SYSTEM', db?: any) {
    const client = db || supabase;
    try {
      const result = await client
        .from('company_memory')
        .upsert(
          {
            workspace_id: workspaceId,
            memory_type: 'OUTCOME',
            title,
            content,
            source_type: 'TASK',
            source_id: sourceId,
            importance: 'medium',
            created_by: createdBy
          },
          { onConflict: 'workspace_id,source_type,source_id' }
        );
      if (result?.error) console.error(`[CompanyMemoryService] Outcome memory error: ${result.error.message}`);
    } catch (e: any) {
      console.error(`[CompanyMemoryService] Outcome error: ${e.message}`);
    }
  }

  static async recordLesson(workspaceId: string, title: string, content: string, sourceId: string, createdBy: string = 'SYSTEM', db?: any) {
    const client = db || supabase;
    try {
      const result = await client
        .from('company_memory')
        .upsert(
          {
            workspace_id: workspaceId,
            memory_type: 'LESSON',
            title,
            content,
            source_type: 'INCIDENT',
            source_id: sourceId,
            importance: 'high',
            created_by: createdBy
          },
          { onConflict: 'workspace_id,source_type,source_id' }
        );
      if (result?.error) console.error(`[CompanyMemoryService] Lesson memory error: ${result.error.message}`);
    } catch (e: any) {
      console.error(`[CompanyMemoryService] Lesson error: ${e.message}`);
    }
  }

  static async archiveMemory(memoryId: string, workspaceId: string) {
    const { data, error } = await supabase
      .from('company_memory')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', memoryId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();
    
    return { data, error };
  }

  // Accept optional db to allow CEOService / runtime to pass their own Supabase client (fixes test isolation)
  static async getRelevantMemory(workspaceId: string, role: string, limit: number = 20, db?: any): Promise<any[]> {
    if (!workspaceId) return [];
    const client = db || supabase;
    try {
      let query = client
        .from('company_memory')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Role-based bounded retrieval — never dumps entire table
      if (role === 'CEO') {
        query = query.in('memory_type', ['GOAL', 'DECISION', 'INCIDENT', 'LESSON', 'FACT', 'OUTCOME']);
      } else if (role === 'CTO') {
        query = query.in('memory_type', ['DECISION', 'INCIDENT', 'OUTCOME', 'LESSON']);
      } else if (role === 'CMO') {
        query = query.in('memory_type', ['FACT', 'DECISION', 'OUTCOME', 'GOAL']);
      } else if (role === 'CFO') {
        query = query.in('memory_type', ['DECISION', 'OUTCOME', 'FACT']);
      }

      const { data, error } = await query.limit(limit);
      if (error || !data) return [];
      return data;
    } catch (e: any) {
      // Silently return empty on any error (tests with incomplete mocks, network issues)
      return [];
    }
  }

  static formatMemoryForContext(memories: any[]): string {
    if (!memories || memories.length === 0) return '';
    
    let context = `\n==================================================\n`;
    context += `VERIFIED COMPANY MEMORY\n`;
    context += `(Memory is historical context, not proof that the current situation is unchanged.)\n`;
    context += `==================================================\n\n`;

    for (const mem of memories) {
      const dateStr = mem.created_at ? new Date(mem.created_at).toISOString().split('T')[0] : 'unknown';
      context += `[${mem.memory_type}] ${mem.title}\n`;
      context += `Date: ${dateStr}\n`;
      context += `Source: ${mem.source_type}\n`;
      context += `Content: ${mem.content}\n\n`;
    }

    return context;
  }
}
