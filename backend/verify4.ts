import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function run() {
  const missionId = '1ba84012-52f7-460b-b672-65feb3ca1697';
  const { data: steps } = await supabase.from('mission_plan_steps').select('*').eq('mission_id', missionId).order('step_order', { ascending: true });
  console.log('--- STEPS ---');
  steps?.forEach(s => console.log(`${s.step_order} - ${s.step_type} - ${s.status}`));
}
run().catch(console.error);
