import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');

async function poll() {
  const missionId = '1ba84012-52f7-460b-b672-65feb3ca1697';
  console.log(`Polling for new tasks on mission ${missionId}...`);
  let initialTaskCount = -1;

  for (let i = 0; i < 60; i++) {
    const { data: tasks } = await supabase.from('tasks').select('id, title, status, assigned_agent_id, input, output').eq('mission_id', missionId).order('created_at', { ascending: false });
    
    if (initialTaskCount === -1) {
       initialTaskCount = tasks?.length || 0;
       console.log(`Initial tasks: ${initialTaskCount}`);
    } else if (tasks && tasks.length > initialTaskCount) {
       console.log('SUCCESS: New task created!');
       console.log(tasks[0]);
       
       // Also check step status
       const { data: steps } = await supabase.from('mission_plan_steps').select('id, step_type, status').eq('mission_id', missionId).eq('step_order', 1).single();
       console.log('Step Status:', steps?.status);
       
       return;
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  console.log('Timeout waiting for mission tasks.');
}
poll().catch(console.error);
