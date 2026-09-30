const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'CompanyCoordinationService.ts');
let content = fs.readFileSync(file, 'utf8');

const newMethods = `
    static async getOrCreateCoordination(supabase: SupabaseClient, workspaceId: string, objectiveId: string, founderDirective?: string) {
        let { data: coord } = await supabase.from('company_coordinations')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('objective_id', objectiveId)
            .single();
            
        if (!coord) {
            const { data: newCoord } = await supabase.from('company_coordinations').insert({
                workspace_id: workspaceId,
                objective_id: objectiveId,
                founder_directive: founderDirective || 'Autonomously extracted objective',
                status: 'ACTIVE',
                primary_executive: 'COO',
                current_state: {}
            }).select().single();
            coord = newCoord;
        }
        return coord;
    }

    static async updateExecutiveState(supabase: SupabaseClient, workspaceId: string, coordinationId: string, executive: string, state: string, details?: any) {
        const { data: coord } = await supabase.from('company_coordinations').select('current_state, version').eq('id', coordinationId).single();
        if (!coord) return;

        const newState = { ...(coord.current_state || {}), [executive]: state };
        
        await supabase.from('company_coordinations').update({
            current_state: newState,
            updated_at: new Date().toISOString(),
            version: (coord.version || 1) + 1
        }).eq('id', coordinationId);

        await supabase.from('action_audit_logs').insert({
            workspace_id: workspaceId,
            action: \`EXECUTIVE_STATE_CHANGE_\${executive}\`,
            status: 'COMPLETED',
            details: { state, ...details },
            timestamp: new Date().toISOString()
        });
    }

    static async recordStrategicConflict(supabase: SupabaseClient, workspaceId: string, coordinationId: string, conflictData: any) {
        const { data: coord } = await supabase.from('company_coordinations').select('conflicts, version').eq('id', coordinationId).single();
        if (!coord) return;

        const newConflicts = [...(coord.conflicts || []), conflictData];
        
        await supabase.from('company_coordinations').update({
            conflicts: newConflicts,
            objective_status: 'STRATEGIC_CONFLICT',
            updated_at: new Date().toISOString(),
            version: (coord.version || 1) + 1
        }).eq('id', coordinationId);
    }

    static async escalateToCEO(supabase: SupabaseClient, workspaceId: string, coordinationId: string, reason: string) {
        await this.updateExecutiveState(supabase, workspaceId, coordinationId, 'CEO', 'STRATEGICALLY_BLOCKED', { reason });
    }
`;

content = content.replace(/}\s*$/, newMethods + '\n}');
fs.writeFileSync(file, content);
