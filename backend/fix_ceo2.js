const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'CEOService.ts');
let content = fs.readFileSync(file, 'utf8');

const target = "const { data: goals } = await supabase.from('business_goals')";
const replacement = `
        const { CompanyCoordinationService } = require('./CompanyCoordinationService');
        const { data: goals } = await supabase.from('business_goals')`;
content = content.replace(target, replacement);

const conflictTarget = "if (costGoals.length > 0 && growthGoals.length > 0) {";
const conflictReplacement = `if (costGoals.length > 0 && growthGoals.length > 0) {
            conflictDetected = true;
            for (const c of costGoals) {
                const coord = await CompanyCoordinationService.getOrCreateCoordination(supabase, workspaceId, c.id, c.objective);
                await CompanyCoordinationService.recordStrategicConflict(supabase, workspaceId, coord.id, {
                    type: 'FINANCIAL_VS_GROWTH', evidence: 'Multiple conflicting goals active', status: 'DETECTED'
                });
                await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, coord.id, 'CEO', 'STRATEGIC_CONFLICT_DETECTED');
            }`;
content = content.replace(conflictTarget, conflictReplacement);

const loopTarget = "for (const goal of goals) {";
const loopReplacement = `for (const goal of goals) {
            const coord = await CompanyCoordinationService.getOrCreateCoordination(supabase, workspaceId, goal.id, goal.objective);
            await supabase.from('company_coordinations').update({ strategic_priority: priority }).eq('id', coord.id);`;
content = content.replace(loopTarget, loopReplacement);

const execTarget = "const nextContext = { depth: currentDepth + 1, visited: [...(context?.visited || []), 'CEO'] };";
const execReplacement = `const nextContext = { depth: currentDepth + 1, visited: [...(context?.visited || []), 'CEO'], coordinationId: coord.id, objectiveId: goal.id };
                 await CompanyCoordinationService.updateExecutiveState(supabase, workspaceId, coord.id, 'CEO', 'DELEGATED_TO_COO');`;
content = content.replace(new RegExp(execTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), execReplacement);

fs.writeFileSync(file, content);
