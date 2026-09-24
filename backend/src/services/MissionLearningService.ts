import { SupabaseClient } from '@supabase/supabase-js';

export class MissionLearningService {
    
    /**
     * Extracts deterministically bound learning candidates from mission results.
     */
    static async extractMissionLearnings(supabase: SupabaseClient, workspaceId: string, missionId: string): Promise<any[]> {
        // Fetch mission to understand context
        const { data: mission } = await supabase.from('business_missions').select('*').eq('id', missionId).eq('workspace_id', workspaceId).single();
        if (!mission) return [];

        // Fetch verified results only
        const { data: results } = await supabase.from('mission_results')
            .select('*')
            .eq('mission_id', missionId)
            .eq('workspace_id', workspaceId)
            .eq('verification_status', 'VERIFIED');

        if (!results || results.length === 0) return [];

        const learnings: any[] = [];
        
        // Determinstic Observation logic for GET_CUSTOMERS
        if (mission.type === 'GET_CUSTOMERS') {
            const total = results.length;
            learnings.push({
                title: 'Total Verified Prospects',
                content: `${total} verified prospects were acquired and qualified.`,
                memory_type: 'OBSERVATION',
                confidence: 'high',
                evidence_summary: `Derived from ${total} verified mission results.`,
                source_result_ids: results.map(r => r.id),
                status: 'VERIFIED'
            });

            // Count by Industry (if present in evidence)
            const industryCounts: Record<string, number> = {};
            const resultIdsByIndustry: Record<string, string[]> = {};
            let hasIndustry = false;
            
            for (const r of results) {
                if (r.evidence && r.evidence.Industry) {
                    hasIndustry = true;
                    const ind = r.evidence.Industry;
                    industryCounts[ind] = (industryCounts[ind] || 0) + 1;
                    if (!resultIdsByIndustry[ind]) resultIdsByIndustry[ind] = [];
                    resultIdsByIndustry[ind].push(r.id);
                }
            }

            if (hasIndustry) {
                for (const [ind, count] of Object.entries(industryCounts)) {
                    learnings.push({
                        title: `Prospect Industry: ${ind}`,
                        content: `${count} of ${total} verified prospects were in the ${ind} industry.`,
                        memory_type: 'OBSERVATION',
                        confidence: 'high',
                        evidence_summary: `Direct extraction from verified evidence.`,
                        source_result_ids: resultIdsByIndustry[ind],
                        status: 'VERIFIED'
                    });
                    
                    // Simple deterministic Insight rule: If an industry makes up > 50% and count > 3
                    if (count > 3 && (count / total) > 0.5) {
                        learnings.push({
                            title: `Industry Trend: ${ind}`,
                            content: `The ${ind} industry represents a majority (${Math.round((count/total)*100)}%) of our highly qualified verified prospects.`,
                            memory_type: 'INSIGHT',
                            confidence: 'medium', // Insights are generalizations, so medium confidence by default
                            evidence_summary: `${count} out of ${total} results share this characteristic.`,
                            source_result_ids: resultIdsByIndustry[ind],
                            status: 'VERIFIED'
                        });
                    }
                }
            }
        }

        return learnings;
    }

    /**
     * Persists a batch of learnings, ensuring we don't blindly duplicate or overwrite owner policies.
     */
    static async persistLearnings(supabase: SupabaseClient, workspaceId: string, missionId: string, learnings: any[]): Promise<void> {
        for (const learning of learnings) {
            // Deduplication strategy: Use workspace_id + source_mission_id + title + memory_type
            // We use title as a simple fingerprint for deterministic observations.
            const { data: existing } = await supabase.from('company_memory')
                .select('id, status, confidence')
                .eq('workspace_id', workspaceId)
                .eq('source_mission_id', missionId)
                .eq('title', learning.title)
                .eq('memory_type', learning.memory_type)
                .single();

            if (existing) {
                // Already exists, just optionally update evidence count
                continue;
            }

            await supabase.from('company_memory').insert({
                workspace_id: workspaceId,
                memory_type: learning.memory_type,
                title: learning.title,
                content: learning.content,
                source_type: 'MISSION',
                source_mission_id: missionId,
                source_result_ids: learning.source_result_ids || [],
                importance: 'medium',
                confidence: learning.confidence,
                status: learning.status || 'CANDIDATE',
                evidence_summary: learning.evidence_summary,
                verified_at: learning.status === 'VERIFIED' ? new Date().toISOString() : null,
                created_by: 'SYSTEM'
            });
        }
    }

    /**
     * Used by the CEO or other external agents to propose a HYPOTHESIS based on mission outcomes.
     */
    static async proposeHypothesis(supabase: SupabaseClient, workspaceId: string, missionId: string, content: string, title: string): Promise<void> {
        // Hypotheses are explicitly marked and LOW confidence
        await supabase.from('company_memory').insert({
            workspace_id: workspaceId,
            memory_type: 'HYPOTHESIS',
            title,
            content,
            source_type: 'MISSION',
            source_mission_id: missionId,
            importance: 'medium',
            confidence: 'low',
            status: 'CANDIDATE',
            evidence_summary: 'Proposed by AI for future testing. Lacks direct verification.',
            created_by: 'SYSTEM'
        });
    }

    /**
     * Helper to pull recent learnings for context injection.
     */
    static async getRecentMissionLearnings(supabase: SupabaseClient, workspaceId: string, limit: number = 10): Promise<any[]> {
        const { data } = await supabase.from('company_memory')
            .select('*')
            .eq('workspace_id', workspaceId)
            .in('memory_type', ['OBSERVATION', 'INSIGHT', 'HYPOTHESIS'])
            .in('status', ['VERIFIED', 'CANDIDATE'])
            .order('created_at', { ascending: false })
            .limit(limit);
        return data || [];
    }
}
