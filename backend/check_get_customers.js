const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function run() {
  const { data } = await supabase.from('tasks').select('*').eq('id', '810a4627-9aae-4fdb-8784-256d8390d7f9').single();
  console.log('Task:', JSON.stringify(data, null, 2));
  if (data) {
    const { data: step } = await supabase.from('mission_plan_steps').select('*').eq('id', data.mission_step_id).single();
    console.log('Step:', JSON.stringify(step, null, 2));
  }
}
run().catch(console.error);
