import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function run() {
  const { data: tasks } = await supabase.from('tasks').select('*').eq('mission_id', '1ba84012-52f7-460b-b672-65feb3ca1697').order('created_at', { ascending: false });
  console.log('Tasks for mission:');
  tasks?.forEach(t => console.log(`${t.id} - ${t.status} - ${t.created_at}`));
}
run().catch(console.error);
