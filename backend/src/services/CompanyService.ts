import { SupabaseClient } from '@supabase/supabase-js';

export class CompanyService {
    /**
     * V6.0 Company Readiness Check
     */
    static async checkReadiness(supabase: SupabaseClient, workspaceId: string): Promise<{ ready: boolean; reasons: string[] }> {
        const reasons: string[] = [];
        
        // 1. Check workspace exists
        const { data: ws } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
        if (!ws) {
            return { ready: false, reasons: ['Company does not exist'] };
        }

        // 2. Check brain initialized
        const { data: brainCount } = await supabase.from('company_memory').select('id', { count: 'exact' }).eq('workspace_id', workspaceId);
        if (!brainCount || brainCount.length === 0) {
            reasons.push('Company Brain is empty');
        }

        // 3. Check connections
        const { data: connections } = await supabase.from('company_systems').select('*').eq('workspace_id', workspaceId).eq('status', 'CONNECTED');
        if (!connections || connections.length === 0) {
            reasons.push('No active system connections');
        }

        // 4. Check business goals
        const { data: goals } = await supabase.from('business_goals').select('*').eq('workspace_id', workspaceId).eq('status', 'ACTIVE');
        if (!goals || goals.length === 0) {
            reasons.push('No active business goals defined');
        }

        return {
            ready: reasons.length === 0,
            reasons
        };
    }

    /**
     * V6.0 Company Activation
     */
    static async activateCompany(supabase: SupabaseClient, workspaceId: string): Promise<boolean> {
        const { ready, reasons } = await this.checkReadiness(supabase, workspaceId);
        if (!ready) {
            throw new Error(`Cannot activate company. Not ready: ${reasons.join(', ')}`);
        }

        const { error } = await supabase.from('workspaces').update({ operating_state: 'READY' }).eq('id', workspaceId);
        if (error) throw error;
        
        return true;
    }
}
