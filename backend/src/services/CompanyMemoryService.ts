import { SupabaseClient } from '@supabase/supabase-js';

export type MemoryCategory = 'STRATEGIC_CONTEXT' | 'DECISION' | 'LESSON' | 'INCIDENT' | 'OUTCOME' | 'GOAL' | 'FACT' | 'RULE' | 'PREFERENCE';

export type SourceType = 'USER' | 'SYSTEM' | 'AGENT' | 'OWNER' | 'APPROVAL' | 'TASK' | 'INCIDENT';

export interface CreateMemoryParams {
  workspaceId: string;
  category: MemoryCategory;
  memoryType?: string; // For backwards compatibility
  title: string;
  content: string; // The "statement"
  sourceType: SourceType;
  sourceId?: string;
  evidence?: any;
  confidence?: number;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED';
  relatedMissionId?: string;
  relatedIncidentId?: string;
  relatedDecisionId?: string;
  supersededBy?: string;
  importance?: string;
  createdBy: string;
}

export class CompanyMemoryService {
  static async createMemory(params: CreateMemoryParams, supabaseClient: SupabaseClient) {
    if (!params.workspaceId) throw new Error('Workspace ID is required');
    const client = supabaseClient;
    
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
            memory_type: params.category || params.memoryType,
            category: params.category,
            title: params.title,
            content: params.content,
            source_type: params.sourceType,
            source_id: params.sourceId,
            importance: params.importance || 'medium',
            created_by: params.createdBy,
            evidence: params.evidence,
            confidence: params.confidence,
            verification_status: params.verificationStatus || 'UNVERIFIED',
            related_mission_id: params.relatedMissionId,
            related_incident_id: params.relatedIncidentId,
            related_decision_id: params.relatedDecisionId,
            superseded_by: params.supersededBy
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

  static async recordDecision(workspaceId: string, title: string, content: string, sourceId: string, createdBy: string = 'OWNER', evidence?: any, db?: SupabaseClient) {
    if (!db) throw new Error('Supabase client is required');
    return this.createMemory({
      workspaceId,
      category: 'DECISION',
      title,
      content,
      sourceType: 'APPROVAL',
      sourceId,
      evidence,
      createdBy,
      importance: 'high',
      verificationStatus: 'VERIFIED'
    }, db);
  }

  static async recordOutcome(workspaceId: string, title: string, content: string, sourceId: string, createdBy: string = 'SYSTEM', relatedMissionId?: string, evidence?: any, db?: SupabaseClient) {
    if (!db) throw new Error('Supabase client is required');
    return this.createMemory({
      workspaceId,
      category: 'OUTCOME',
      title,
      content,
      sourceType: 'TASK',
      sourceId,
      relatedMissionId,
      evidence,
      createdBy,
      importance: 'medium',
      verificationStatus: 'VERIFIED'
    }, db);
  }

  static async recordLesson(workspaceId: string, title: string, content: string, sourceId: string, createdBy: string = 'SYSTEM', relatedIncidentId?: string, evidence?: any, db?: SupabaseClient) {
    if (!db) throw new Error('Supabase client is required');
    return this.createMemory({
      workspaceId,
      category: 'LESSON',
      title,
      content,
      sourceType: 'INCIDENT',
      sourceId,
      relatedIncidentId,
      evidence,
      createdBy,
      importance: 'high',
      verificationStatus: 'VERIFIED'
    }, db);
  }

  static async archiveMemory(memoryId: string, workspaceId: string, supabaseClient: SupabaseClient) {
    const { data, error } = await supabaseClient
      .from('company_memory')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', memoryId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();
    
    return { data, error };
  }

  static async getRelevantMemory(workspaceId: string, role: string, limit: number = 20, db?: SupabaseClient): Promise<any[]> {
    if (!workspaceId) return [];
    const client = db;
    if (!client) throw new Error('Supabase client is required');
    try {
      let query = client
        .from('company_memory')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('status', ['active', 'VERIFIED'])
        .order('created_at', { ascending: false });

      if (role === 'CEO') {
        query = query.in('category', ['GOAL', 'DECISION', 'INCIDENT', 'LESSON', 'FACT', 'OUTCOME', 'RULE', 'PREFERENCE', 'STRATEGIC_CONTEXT']);
      } else if (role === 'CTO') {
        query = query.in('category', ['DECISION', 'INCIDENT', 'OUTCOME', 'LESSON', 'RULE', 'PREFERENCE']);
      } else if (role === 'CMO') {
        query = query.in('category', ['FACT', 'DECISION', 'OUTCOME', 'GOAL', 'RULE', 'PREFERENCE', 'STRATEGIC_CONTEXT']);
      } else if (role === 'CFO') {
        query = query.in('category', ['DECISION', 'OUTCOME', 'FACT', 'RULE', 'PREFERENCE', 'STRATEGIC_CONTEXT']);
      }

      const { data, error } = await query.limit(50);
      if (error || !data) return [];
      
      const sortedData = data.sort((a: any, b: any) => {
        const getPriority = (mem: any) => {
          if (mem.source_type === 'OWNER' && mem.category === 'RULE') return 1;
          if (mem.source_type === 'OWNER') return 2;
          if (mem.category === 'LESSON' || mem.category === 'OUTCOME') return 3;
          return 4;
        };
        const pA = getPriority(a);
        const pB = getPriority(b);
        if (pA !== pB) return pA - pB;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return sortedData.slice(0, limit);
    } catch (e: any) {
      return [];
    }
  }

  static formatMemoryForContext(memories: any[]): string {
    if (!memories || memories.length === 0) return '';
    
    let context = `\n==================================================\n`;
    context += `COMPANY MEMORY & OWNER DIRECTIVES\n`;
    context += `(Owner rules MUST be strictly followed as operational constraints)\n`;
    context += `==================================================\n\n`;

    for (const mem of memories) {
      const dateStr = mem.created_at ? new Date(mem.created_at).toISOString().split('T')[0] : 'unknown';
      const isOwner = mem.source_type === 'OWNER';
      const cat = mem.category || mem.memory_type;
      
      if (isOwner) {
        context += `>>> [OWNER ${cat}] ${mem.title} <<<\n`;
        context += `Content: ${mem.content}\n`;
        context += `(Mandatory owner directive)\n\n`;
      } else {
        context += `[${cat}] ${mem.title}\n`;
        context += `Date: ${dateStr} | Source: ${mem.source_type}\n`;
        context += `Content: ${mem.content}\n`;
        if (mem.evidence) context += `Evidence: ${JSON.stringify(mem.evidence)}\n`;
        if (mem.verification_status) context += `Status: ${mem.verification_status}\n`;
        context += `\n`;
      }
    }

    return context;
  }
}
