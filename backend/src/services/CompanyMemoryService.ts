import { SupabaseClient } from '@supabase/supabase-js';

export type MemoryCategory = 'STRATEGIC_CONTEXT' | 'DECISION' | 'LESSON' | 'INCIDENT' | 'OUTCOME' | 'GOAL' | 'FACT' | 'RULE' | 'PREFERENCE' | 'CUSTOMER_CONTEXT' | 'PRODUCT_CONTEXT' | 'MARKET_CONTEXT' | 'FINANCIAL_CONTEXT' | 'TECHNICAL_CONTEXT' | 'OPERATIONAL_CONTEXT' | 'FAILURE' | 'ASSUMPTION' | 'INFERENCE';

export type SourceType = 'USER' | 'SYSTEM' | 'AGENT' | 'OWNER' | 'APPROVAL' | 'TASK' | 'INCIDENT' | 'WEBSITE_DISCOVERY' | 'CONNECTED_SYSTEM' | 'EXECUTIVE' | 'WORKER' | 'EXTERNAL_SOURCE';

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
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED' | 'SOURCE_BACKED' | 'INDEPENDENTLY_VERIFIED';
  relatedMissionId?: string;
  relatedIncidentId?: string;
  relatedDecisionId?: string;
  supersededBy?: string;
  importance?: string;
  createdBy: string;
}

export class CompanyMemoryService {
  static checkSecrets(content: string) {
    const secretPatterns = [
        /(sk-[a-zA-Z0-9-]{20,})/i,
        /(gh[pousrab]_[a-zA-Z0-9]{36})/i,
        /(xox[baprs]-[0-9a-zA-Z]{10,})/i,
        /(ya29\.[0-9a-zA-Z_-]+)/i,
        /(eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i,
        /(AKIA[0-9A-Z]{16})/i,
        /-----BEGIN PRIVATE KEY-----/i,
        /-----BEGIN RSA PRIVATE KEY-----/i,
        /(postgres(ql)?:\/\/.*:.*@.*)/i,
        /(mysql:\/\/.*:.*@.*)/i,
        /bearer\s+[a-zA-Z0-9_\-\.]+/i,
        /(api[_-]?key[\s:=]+['"]?[a-zA-Z0-9\-_]+['"]?)/i,
        /(secret[\s:=]+['"]?[a-zA-Z0-9\-_]+['"]?)/i,
        /(password[\s:=]+['"]?[a-zA-Z0-9\-_!@#$%^&*]+['"]?)/i
    ];
    for (const pattern of secretPatterns) {
        if (pattern.test(content)) return true;
    }
    return false;
  }

  static async createMemory(params: CreateMemoryParams, supabaseClient: SupabaseClient) {
    if (!params.workspaceId) throw new Error('Workspace ID is required');
    const client = supabaseClient;
    
    if (this.checkSecrets(params.content)) {
      throw new Error('Security: Cannot store secrets in memory');
    }

    try {
      const { data: existing } = await client
        .from('company_memory')
        .select('*')
        .eq('workspace_id', params.workspaceId)
        .eq('title', params.title)

      let isSuperseded = false;
      let contradictionTargetId: string | null = null;
      let relationshipType = 'CONTRADICTS';
      
      if (existing && existing.length > 0) {
          for (const ex of existing) {
              if (ex.content === params.content) return ex;
              
              const authRank = (type: string) => {
                  if (type === 'OWNER') return 5;
                  if (type === 'CONNECTED_SYSTEM') return 4;
                  if (type === 'WEBSITE_DISCOVERY') return 3;
                  if (type === 'EXECUTIVE') return 2;
                  return 1;
              };
              
              const incomingRank = authRank(params.sourceType);
              const existingRank = authRank(ex.source_type);
              
              const isIncomingHistorical = params.evidence?.temporal_scope === 'HISTORICAL';
              const isExistingHistorical = ex.evidence?.temporal_scope === 'HISTORICAL';
              
              if (isIncomingHistorical || isExistingHistorical) {
                  contradictionTargetId = ex.id;
                  relationshipType = 'RELATES_TO';
              } else {
                  if (incomingRank < existingRank) {
                      isSuperseded = true;
                      contradictionTargetId = ex.id;
                      relationshipType = 'CONTRADICTS';
                  } else if (incomingRank >= existingRank) {
                      if (incomingRank === existingRank && ex.source_type === 'OWNER') {
                           await client.from('company_memory').update({ freshness_status: 'SUPERSEDED' }).eq('id', ex.id);
                           contradictionTargetId = ex.id;
                           relationshipType = 'SUPERSEDES';
                      } else if (incomingRank > existingRank) {
                          await client.from('company_memory').update({ freshness_status: 'SUPERSEDED' }).eq('id', ex.id);
                          contradictionTargetId = ex.id;
                          relationshipType = 'SUPERSEDES';
                      } else {
                          contradictionTargetId = ex.id;
                          relationshipType = 'CONTRADICTS';
                      }
                  }
              }
          }
      }

      const { data, error } = await client
        .from('company_memory')
        .insert({
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
            confidence: params.confidence || (params.sourceType === 'OWNER' ? 1.0 : 0.8),
            verification_status: params.verificationStatus || 'UNVERIFIED',
            related_mission_id: params.relatedMissionId,
            related_incident_id: params.relatedIncidentId,
            related_decision_id: params.relatedDecisionId,
            superseded_by: params.supersededBy,
            freshness_status: isSuperseded ? 'SUPERSEDED' : 'CURRENT'
        })
        .select()
        .single();
      
      if (error) {
        console.error('[CompanyMemoryService] Error creating memory:', error);
        return null;
      }
      
      if (contradictionTargetId && data) {
          await client.from('memory_relationships').insert({
              workspace_id: params.workspaceId,
              source_memory_id: data.id,
              target_memory_id: contradictionTargetId,
              relationship_type: relationshipType
          });
      }

      return data;
    } catch (e: any) {
      console.error('[CompanyMemoryService] Error:', e);
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
      evidence: { ...evidence, expected_effect: evidence?.expected_effect, actual_result: evidence?.actual_result },
      createdBy,
      importance: 'high',
      verificationStatus: 'INDEPENDENTLY_VERIFIED'
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
      verificationStatus: 'INDEPENDENTLY_VERIFIED'
    }, db);
  }

  static async recordLesson(workspaceId: string, title: string, content: string, sourceId: string, createdBy: string = 'SYSTEM', relatedIncidentId?: string, evidence?: any, db?: SupabaseClient) {
    if (!db) throw new Error('Supabase client is required');
    if (!evidence || !evidence.observation || !evidence.interpretation) {
      evidence = { ...evidence, status: 'INSUFFICIENT_DATA', interpretation: 'Unknown root cause due to lack of evidence.' };
    }
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
      verificationStatus: 'INDEPENDENTLY_VERIFIED'
    }, db);
  }

  static async recordFailure(workspaceId: string, title: string, content: string, sourceId: string, createdBy: string = 'SYSTEM', relatedIncidentId?: string, evidence?: any, db?: SupabaseClient) {
    if (!db) throw new Error('Supabase client is required');
    return this.createMemory({
      workspaceId,
      category: 'FAILURE',
      title,
      content,
      sourceType: 'INCIDENT',
      sourceId,
      relatedIncidentId,
      evidence: { ...evidence, confirmed_cause: evidence?.confirmed_cause || false, suspected_cause: evidence?.suspected_cause },
      createdBy,
      importance: 'high',
      verificationStatus: 'INDEPENDENTLY_VERIFIED'
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
        .neq('status', 'archived')
        .neq('freshness_status', 'SUPERSEDED')
        .order('created_at', { ascending: false });

      if (role === 'CEO') {
        // CEO gets strategic cross-company context
        query = query.in('category', ['GOAL', 'DECISION', 'INCIDENT', 'LESSON', 'FACT', 'OUTCOME', 'RULE', 'PREFERENCE', 'STRATEGIC_CONTEXT', 'CUSTOMER_CONTEXT', 'MARKET_CONTEXT', 'FAILURE', 'ASSUMPTION']);
      } else if (role === 'CTO') {
        query = query.in('category', ['DECISION', 'INCIDENT', 'OUTCOME', 'LESSON', 'RULE', 'PREFERENCE', 'TECHNICAL_CONTEXT', 'FAILURE']);
      } else if (role === 'CMO') {
        query = query.in('category', ['FACT', 'DECISION', 'OUTCOME', 'GOAL', 'RULE', 'PREFERENCE', 'STRATEGIC_CONTEXT', 'CUSTOMER_CONTEXT', 'MARKET_CONTEXT', 'PRODUCT_CONTEXT', 'LESSON']);
      } else if (role === 'CFO') {
        query = query.in('category', ['DECISION', 'OUTCOME', 'FACT', 'RULE', 'PREFERENCE', 'STRATEGIC_CONTEXT', 'FINANCIAL_CONTEXT', 'OPERATIONAL_CONTEXT']);
      }

      const { data, error } = await query.limit(100); // Fetch more for sorting
      if (error || !data) return [];
      
      const sortedData = data.sort((a: any, b: any) => {
        const authRank = (type: string) => {
            if (type === 'OWNER') return 5;
            if (type === 'CONNECTED_SYSTEM') return 4;
            if (type === 'WEBSITE_DISCOVERY') return 3;
            if (type === 'EXECUTIVE') return 2;
            return 1;
        };

        const rankA = authRank(a.source_type);
        const rankB = authRank(b.source_type);

        if (rankA !== rankB) return rankB - rankA;

        const isVerifA = a.verification_status === 'INDEPENDENTLY_VERIFIED' || a.verification_status === 'VERIFIED';
        const isVerifB = b.verification_status === 'INDEPENDENTLY_VERIFIED' || b.verification_status === 'VERIFIED';
        
        if (isVerifA !== isVerifB) return isVerifA ? -1 : 1;
        
        const isCurrentA = a.freshness_status === 'CURRENT';
        const isCurrentB = b.freshness_status === 'CURRENT';
        
        if (isCurrentA !== isCurrentB) return isCurrentA ? -1 : 1;

        if (a.category === 'RULE' && b.category !== 'RULE') return -1;
        if (b.category === 'RULE' && a.category !== 'RULE') return 1;

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
    context += `COMPANY BRAIN - SHARED ORGANIZATIONAL MEMORY\n`;
    context += `(Owner rules MUST be strictly followed as operational constraints)\n`;
    context += `==================================================\n\n`;

    for (const mem of memories) {
      const dateStr = mem.created_at ? new Date(mem.created_at).toISOString().split('T')[0] : 'unknown';
      const isOwner = mem.source_type === 'OWNER';
      const cat = mem.category || mem.memory_type;
      
      if (isOwner) {
        context += `>>> [OWNER ${cat}] ${mem.title} <<<\n`;
        context += `Content: ${mem.content}\n`;
        context += `Status: ${mem.freshness_status} | Verification: INDEPENDENTLY_VERIFIED\n`;
        context += `(Mandatory owner directive)\n\n`;
      } else {
        context += `[${cat}] ${mem.title}\n`;
        context += `Date: ${dateStr} | Source: ${mem.source_type} | Freshness: ${mem.freshness_status || 'CURRENT'}\n`;
        context += `Content: ${mem.content}\n`;
        if (mem.evidence) context += `Evidence: ${JSON.stringify(mem.evidence)}\n`;
        if (mem.verification_status) context += `Status: ${mem.verification_status}\n`;
        context += `\n`;
      }
    }

    return context;
  }
}


