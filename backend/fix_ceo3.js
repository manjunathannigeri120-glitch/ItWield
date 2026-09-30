const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'CEOService.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /await supabase.from\('company_coordinations'\)\.update\(\{ strategic_priority: priority \}\)\.eq\('id', coord\.id\);/g,
    `let priority = 'MEDIUM';
            if (goal.objective.toLowerCase().includes('critical') || conflictDetected) {
                priority = 'HIGH';
            }
            if (goal.priority !== priority) {
                await supabase.from('business_goals').update({ priority }).eq('id', goal.id);
            }
            await supabase.from('company_coordinations').update({ strategic_priority: priority }).eq('id', coord.id);`
);

fs.writeFileSync(file, content);
