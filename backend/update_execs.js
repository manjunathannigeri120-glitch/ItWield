const fs = require('fs');
const path = require('path');

const services = ['CMOService', 'CTOService', 'CFOService'];

for (const svc of services) {
    const file = path.join(__dirname, 'src', 'services', `${svc}.ts`);
    if (!fs.existsSync(file)) continue;
    
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('import { CompanyCoordinationService }')) {
        content = "import { CompanyCoordinationService } from './CompanyCoordinationService';\n" + content;
    }

    content = content.replace(
        /static async operate\(supabase: SupabaseClient, workspaceId: string\)/g,
        'static async operate(supabase: SupabaseClient, workspaceId: string, context?: any)'
    );

    const execCall = `await this.executeOperatingLoop(supabase, workspaceId);`;
    const execReplacement = `if (context?.coordinationId) {
                await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, context.coordinationId, '${svc.replace('Service', '')}', 'EXECUTING');
            }
            await this.executeOperatingLoop(supabase, workspaceId);
            if (context?.coordinationId) {
                await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, context.coordinationId, '${svc.replace('Service', '')}', 'ACHIEVED');
            }`;
    content = content.replace(execCall, execReplacement);

    fs.writeFileSync(file, content);
}
