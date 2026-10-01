import { SupabaseClient } from '@supabase/supabase-js';

export class CreditService {
    static readonly INITIAL_CREDITS = 200;

    static async getCredits(supabase: SupabaseClient, workspaceId: string): Promise<number> {
        const { data, error } = await supabase
            .from('workspaces')
            .select('credits')
            .eq('id', workspaceId)
            .single();

        if (error || !data) return 0;
        return typeof data.credits === 'number' ? data.credits : this.INITIAL_CREDITS;
    }

    static async deductCredits(supabase: SupabaseClient, workspaceId: string, amount: number = 1): Promise<{ allowed: boolean, remaining: number }> {
        // Use the atomic RPC function
        const { data, error } = await supabase.rpc('deduct_workspace_credits', {
            ws_id: workspaceId,
            amount: amount
        });
        
        if (error) {
            console.error('[CreditService] RPC Error:', error);
            return { allowed: false, remaining: 0 };
        }
        
        // RPC returns -1 if not enough credits
        if (data === -1) {
            // Fetch current to know how many were left
            const current = await this.getCredits(supabase, workspaceId);
            return { allowed: false, remaining: current };
        }
        
        return { allowed: true, remaining: data };
    }
}
