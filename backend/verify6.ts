import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function run() {
  const workspaceId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3';
  
  // 429 Provider Cooldown Check
  const { data: recentRateLimits } = await supabase.from('incidents')
    .select('created_at')
    .eq('workspace_id', workspaceId)
    .eq('type', 'PROVIDER_RATE_LIMIT')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (recentRateLimits && recentRateLimits.length > 0) {
    const lastLimit = new Date(recentRateLimits[0].created_at);
    if (Date.now() - lastLimit.getTime() < 15 * 60 * 1000) { // 15 min cooldown
      console.log(`[CEOService] Workspace ${workspaceId} in provider cooldown. Skipping observation.`);
      return;
    }
  }

  // Check missions
  const { data: missions } = await supabase.from('business_missions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .in('status', ['ACTIVE']);
  console.log(`Active missions: ${missions?.length}`);
  
  if (missions && missions.length > 0) {
     const mission = missions.find(m => m.id === '1ba84012-52f7-460b-b672-65feb3ca1697');
     if (mission) {
         console.log('Found target mission active.');
         // Check progress blocker
         // Actually, I can just check the plan steps directly
         const { data: steps } = await supabase.from('mission_plan_steps').select('*').eq('mission_id', mission.id).order('step_order', { ascending: true });
         const readyStep = steps?.find(s => s.status === 'READY');
         console.log('Ready Step:', readyStep?.step_type);
     }
  }
}
run().catch(console.error);
