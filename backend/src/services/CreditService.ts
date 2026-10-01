import { SupabaseClient } from '@supabase/supabase-js';

export class CreditService {
    static readonly INITIAL_CREDITS = 200;

    static async getCredits(supabase: SupabaseClient, workspaceId: string): Promise<number> {
        const { data, error } = await supabase
            .from('workspaces')
            .select('operational_context')
            .eq('id', workspaceId)
            .single();

        if (error || !data) return 0;
        
        let ctx: any = {};
        try {
           ctx = typeof data.operational_context === 'string' ? JSON.parse(data.operational_context) : (data.operational_context || {});
        } catch(e) {}

        if (ctx.hasOwnProperty('credits')) {
            return Number(ctx.credits);
        }
        return this.INITIAL_CREDITS; // Default
    }

    static async deductCredits(supabase: SupabaseClient, workspaceId: string, amount: number = 1): Promise<{ allowed: boolean, remaining: number }> {
        const { data, error } = await supabase
            .from('workspaces')
            .select('operational_context')
            .eq('id', workspaceId)
            .single();
            
        if (error || !data) return { allowed: false, remaining: 0 };
        
        let ctx: any = {};
        try {
           ctx = typeof data.operational_context === 'string' ? JSON.parse(data.operational_context) : (data.operational_context || {});
        } catch(e) {}
        
        const currentCredits = ctx.hasOwnProperty('credits') ? Number(ctx.credits) : this.INITIAL_CREDITS;
        
        if (currentCredits < amount) {
            return { allowed: false, remaining: currentCredits };
        }
        
        const newCredits = currentCredits - amount;
        ctx.credits = newCredits;
        
        await supabase
            .from('workspaces')
            .update({ operational_context: ctx })
            .eq('id', workspaceId);
            
        return { allowed: true, remaining: newCredits };
    }
}
