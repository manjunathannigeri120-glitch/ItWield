const fs = require('fs');
let code = fs.readFileSync('backend/src/services/MissionResultPipelineService.ts', 'utf8');

const replacement = `  static async persistResults(supabase: SupabaseClient, results: any[]) {
    if (!results || results.length === 0) return { success: true, count: 0 };

    const { data, error } = await supabase
      .from('mission_results')
      .upsert(results, { onConflict: 'mission_id, idempotency_key' })
      .select('*');

    if (error) {
      console.error('[MissionResultPipeline] Persistence error:', error);
      throw error;
    }

    // Phase 2: CRM Opportunity integration
    const opportunities = (data || []).filter(r => r.result_type === 'QUALIFIED_PROSPECT' && r.verification_status === 'VERIFIED').map(r => ({
        workspace_id: r.workspace_id,
        mission_id: r.mission_id,
        mission_result_id: r.id,
        company_name: r.evidence?.company_name || 'Unknown',
        website: r.evidence?.public_website || '',
        title: 'Prospect: ' + (r.evidence?.company_name || 'Unknown'),
        description: r.evidence?.reason_for_match || '',
        evidence: r.evidence,
        stage: 'RESEARCHED'
    }));

    if (opportunities.length > 0) {
        const { error: oppError } = await supabase
            .from('opportunities')
            .upsert(opportunities, { onConflict: 'workspace_id, mission_result_id' });
        
        if (oppError) {
            console.error('[MissionResultPipeline] Opportunity persistence error:', oppError);
        }
    }

    return { success: true, count: data?.length || 0 };
  }`;

code = code.replace(/static async persistResults[\s\S]*?\n\}/, replacement + '\n}');
fs.writeFileSync('backend/src/services/MissionResultPipelineService.ts', code);
