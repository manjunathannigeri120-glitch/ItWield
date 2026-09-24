import { SupabaseClient } from '@supabase/supabase-js';

export interface TaskOutput {
  action?: string;
  success?: boolean;
  leads?: any[];
  verification?: {
    verified: boolean;
    checks: string[];
  };
  [key: string]: any;
}

export class MissionResultPipelineService {

  /**
   * Normalizes a business website into a deterministic identity string (domain).
   * Maps 'https://www.example.com/', 'http://example.com', 'example.com' -> 'example.com'
   */
  static normalizeDomain(url: string): string {
    if (!url || typeof url !== 'string') return '';
    let normalized = url.toLowerCase().trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    try {
      const parsed = new URL(normalized);
      let hostname = parsed.hostname;
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      return hostname;
    } catch (e) {
      // Fallback
      return normalized.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || '';
    }
  }

  /**
   * Evaluates a completed task's output and extracts normalized mission results.
   */
  static extractResults(task: any, mission: any): any[] {
    const results: any[] = [];
    
    if (task.status !== 'COMPLETED' || !task.output || !task.mission_id || task.mission_id !== mission.id) {
      return results;
    }

    const output = task.output as TaskOutput;

    // --- GET_CUSTOMERS / LEAD_RESEARCH Extraction ---
    if (mission.type === 'GET_CUSTOMERS' && output.action === 'LEAD_RESEARCH') {
      const leads = Array.isArray(output.leads) ? output.leads : [];
      
      for (const lead of leads) {
        const domain = MissionResultPipelineService.normalizeDomain(lead.public_website);
        
        // Idempotency: uniquely identify this prospect for this mission
        // Fallback to lowercased company name if website is genuinely unparseable
        const identityStr = domain || (lead.company_name ? lead.company_name.toLowerCase().trim() : Math.random().toString());
        const idempotencyKey = 'lead_research_' + mission.id + '_' + identityStr;
        
        const checks: string[] = [];
        let status = 'UNVERIFIED';

        // 1. Structural Checks
        const hasIdentity = !!(lead.company_name && lead.public_website);
        if (hasIdentity) checks.push('Company identity and website exist');
        
        const hasSource = !!lead.public_source;
        if (hasSource) checks.push('Public source/evidence exists');

        // 2. Action-level verification inheritance
        if (output.verification?.verified) {
           checks.push('Action-level verification passed');
        }

        // 3. ICP / Objective checks (basic keyword presence for safety)
        const hasReason = !!lead.reason_for_match;
        if (hasReason) checks.push('Match rationale provided');

        if (hasIdentity && hasSource && hasReason) {
           status = 'VERIFIED';
        } else {
           status = 'REJECTED';
           if (!hasIdentity) checks.push('FAILED: Missing company identity');
           if (!hasSource) checks.push('FAILED: Missing source evidence');
        }

        results.push({
          mission_id: mission.id,
          workspace_id: mission.workspace_id,
          task_id: task.id,
          worker_id: task.assigned_agent_id,
          result_type: 'QUALIFIED_PROSPECT',
          summary: 'Researched: ' + (lead.company_name || 'Unknown'),
          evidence: {
            company_name: lead.company_name,
            public_website: lead.public_website,
            public_source: lead.public_source,
            reason_for_match: lead.reason_for_match,
            confidence: lead.confidence
          },
          verification_status: status,
          verification_checks: JSON.stringify(checks),
          idempotency_key: idempotencyKey,
          verified_at: status === 'VERIFIED' ? new Date().toISOString() : null
        });
      }
    }

    return results;
  }

  /**
   * Safely persists extracted results to the database.
   */
  static async persistResults(supabase: SupabaseClient, results: any[]) {
    if (!results || results.length === 0) return { success: true, count: 0 };

    const { data, error } = await supabase
      .from('mission_results')
      .upsert(results, { onConflict: 'mission_id, idempotency_key' })
      .select('id');

    if (error) {
      console.error('[MissionResultPipeline] Persistence error:', error);
      throw error;
    }

    return { success: true, count: data?.length || 0 };
  }
}
