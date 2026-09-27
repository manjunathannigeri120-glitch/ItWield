import { createClient } from '@supabase/supabase-js';
import { MissionPlanningService } from './src/services/MissionPlanningService';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');

async function run() {
  const workspaceId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3';
  const { data: missions } = await supabase.from('business_missions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('status', ['ACTIVE']);

  if (!missions) return;
  for (const mission of missions) {
     const planData = await MissionPlanningService.getOrCreateActivePlan(supabase, workspaceId, mission.id, mission.type);
     const { readyStep, isComplete } = await MissionPlanningService.evaluatePlanState(supabase, workspaceId, planData.plan, planData.steps);
     console.log(`Mission ${mission.id} -> readyStep: ${readyStep?.id}`);
     
     if (readyStep) {
        // If it got here, it WOULD have executed.
        console.log('WOULD EXECUTE READY STEP!');
     }
  }
}
run().catch(console.error);
