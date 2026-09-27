import { createClient } from '@supabase/supabase-js';
import { MissionPlanningService } from './src/services/MissionPlanningService';
import { MissionProgressService } from './src/services/MissionProgressService';

const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function run() {
  const workspaceId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3';
  const missionId = '1ba84012-52f7-460b-b672-65feb3ca1697';
  
  const progress = await MissionProgressService.calculateProgress(supabase, workspaceId, missionId);
  console.log('Progress Status:', progress.status);

  if (progress.status !== 'ACTIVE') return;

  const planData = await MissionPlanningService.getOrCreateActivePlan(supabase, workspaceId, missionId, 'Get Customers (End-to-End)');
  
  const { readyStep, isComplete } = await MissionPlanningService.evaluatePlanState(supabase, workspaceId, planData.plan, planData.steps);
  console.log('Ready Step:', readyStep?.step_type);
}
run().catch(console.error);
