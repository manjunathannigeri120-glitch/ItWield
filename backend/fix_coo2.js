const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'COOService.ts');
let content = fs.readFileSync(file, 'utf8');

const target = 'private static async coordinateExecutive(supabase: SupabaseClient, workspaceId: string, executive: string, context?: any, objectiveId?: string) {';
const replacement = `private static async coordinateExecutive(supabase: SupabaseClient, workspaceId: string, executive: string, context?: any, objectiveId?: string) {
        if (context?.coordinationId) {
            await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, context.coordinationId, 'COO', \`DELEGATED_TO_\${executive}\`);
        }`;
content = content.replace(target, replacement);

fs.writeFileSync(file, content);
