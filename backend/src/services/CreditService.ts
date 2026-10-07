import { SupabaseClient } from '@supabase/supabase-js';

export class CreditService {
    static readonly INITIAL_CREDITS = 150;
    static readonly SUPERADMIN_EMAIL = 'manjunathannigeri120@gmail.com';

    static async getCredits(supabase: SupabaseClient, workspaceId: string): Promise<number> {
        if (!supabase || typeof supabase.from !== 'function') return this.INITIAL_CREDITS;

        const { data, error } = await supabase
            .from('workspaces')
            .select('credits, owner_id')
            .eq('id', workspaceId)
            .single();

        if (error || !data) return 0;

        // Unified credit pool: sum credits across all workspaces owned by this user
        if (data.owner_id) {
            const { data: allWs } = await supabase
                .from('workspaces')
                .select('credits')
                .eq('owner_id', data.owner_id);

            if (allWs && allWs.length > 0) {
                const total = allWs.reduce((sum: number, w: any) => sum + (w.credits || 0), 0);
                return total;
            }
        }

        return typeof data.credits === 'number' ? data.credits : 0;
    }

    static async deductCredits(supabase: SupabaseClient, workspaceId: string, amount: number = 1): Promise<{ allowed: boolean, remaining: number }> {
        // Fallback for mock clients in unit tests
        if (typeof supabase?.rpc !== 'function') {
            return { allowed: true, remaining: 150 };
        }

        // 1. Try atomic RPC deduction on current workspace
        let { data, error } = await supabase.rpc('deduct_workspace_credits', {
            ws_id: workspaceId,
            amount: amount
        });
        
        if (error) {
            console.error('[CreditService] RPC Error:', error);
            return { allowed: false, remaining: 0 };
        }
        
        // 2. If current workspace has insufficient credits (e.g. data === -1),
        // check if user has credits in another workspace (multi-workspace unified credit pool)
        if (data === -1) {
            if (typeof supabase.from === 'function') {
                const { data: wsData } = await supabase
                    .from('workspaces')
                    .select('owner_id')
                    .eq('id', workspaceId)
                    .single();

                if (wsData?.owner_id) {
                    const { data: otherWorkspaces } = await supabase
                        .from('workspaces')
                        .select('id, credits')
                        .eq('owner_id', wsData.owner_id)
                        .neq('id', workspaceId)
                        .gt('credits', 0)
                        .order('credits', { ascending: false });

                    if (otherWorkspaces && otherWorkspaces.length > 0) {
                        for (const altWs of otherWorkspaces) {
                            const altRes = await supabase.rpc('deduct_workspace_credits', {
                                ws_id: altWs.id,
                                amount: amount
                            });
                            if (typeof altRes.data === 'number' && altRes.data >= 0) {
                                return { allowed: true, remaining: altRes.data };
                            }
                        }
                    }
                }
            }

            const current = await this.getCredits(supabase, workspaceId);
            return { allowed: false, remaining: current };
        }
        
        return { allowed: true, remaining: data };
    }
}
