const fs = require('fs');

let code = fs.readFileSync('backend/src/api/scheduler.ts', 'utf8');

code = code.replace(
    "import { CEOService } from '../services/CEOService';",
    "import { CEOService } from '../services/CEOService';\nimport { AICOOService } from '../services/AICOOService';"
);

const insertion = \
    // 6. Continuous Operating Loop (V3.12)
    const { data: dueGoals } = await supabase.from('business_goals')
      .select('id, workspace_id')
      .eq('status', 'ACTIVE')
      .neq('operating_status', 'PAUSED')
      .neq('operating_status', 'BLOCKED')
      .lte('next_evaluation_at', new Date().toISOString())
      .limit(10);
      
    if (dueGoals && dueGoals.length > 0) {
      const uniqueWids = [...new Set(dueGoals.map((g: any) => g.workspace_id))];
      for (const wid of uniqueWids) {
        console.log('[Scheduler] Autonomous objective due for evaluation. Triggering AICOOService for workspace ' + wid);
        AICOOService.operateCompany(supabase, wid).catch(console.error);
        triggeredCount++;
      }
    }

    return res.status(200)\;

code = code.replace('return res.status(200)', insertion);

fs.writeFileSync('backend/src/api/scheduler.ts', code);
