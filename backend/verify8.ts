import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function run() {
  const { data } = await supabase.from('workspaces').select('status').eq('id', '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3').single();
  console.log(data);
  const { data: step } = await supabase.from('mission_plan_steps').select('status').eq('mission_id', '1ba84012-52f7-460b-b672-65feb3ca1697').eq('step_order', 1).single();
  console.log('Step status:', step);
}
run().catch(console.error);
