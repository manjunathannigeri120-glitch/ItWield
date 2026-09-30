const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'COOService.ts');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { CompanyCoordinationService }')) {
    content = "import { CompanyCoordinationService } from './CompanyCoordinationService';\n" + content;
}

content = content.replace(
    /static async operate\(supabase: SupabaseClient, workspaceId: string\)/g,
    'static async operate(supabase: SupabaseClient, workspaceId: string, context?: any)'
);
content = content.replace(
    /await this\.executeOperatingLoop\(supabase, workspaceId\);/g,
    'await this.executeOperatingLoop(supabase, workspaceId, context);'
);
content = content.replace(
    /private static async executeOperatingLoop\(supabase: SupabaseClient, workspaceId: string\)/g,
    'private static async executeOperatingLoop(supabase: SupabaseClient, workspaceId: string, context?: any)'
);
content = content.replace(
    /await this\.coordinateExecutive\(supabase, workspaceId, blocker\.blocking_executive\);/g,
    'await this.coordinateExecutive(supabase, workspaceId, blocker.blocking_executive, context, goal.id);'
);
content = content.replace(
    /await this\.coordinateExecutive\(supabase, workspaceId, assignedExec\);/g,
    'await this.coordinateExecutive(supabase, workspaceId, assignedExec, context, goal.id);'
);
content = content.replace(
    /private static async coordinateExecutive\(supabase: SupabaseClient, workspaceId: string, executive: string\)/g,
    'private static async coordinateExecutive(supabase: SupabaseClient, workspaceId: string, executive: string, context?: any, objectiveId?: string)'
);
content = content.replace(
    /await CMOService\.operate\(supabase, workspaceId\);/g,
    'await CMOService.operate(supabase, workspaceId, context);'
);
content = content.replace(
    /await CTOService\.operate\(supabase, workspaceId\);/g,
    'await CTOService.operate(supabase, workspaceId, context);'
);
content = content.replace(
    /await CFOService\.operate\(supabase, workspaceId\);/g,
    'await CFOService.operate(supabase, workspaceId, context);'
);
content = content.replace(
    /await this\.coordinateExecutive\(supabase, workspaceId, blockingExec\);/g,
    'await this.coordinateExecutive(supabase, workspaceId, blockingExec, {}, goal.id);'
);


fs.writeFileSync(file, content);
