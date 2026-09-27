import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function run() {
  const missionId = '1ba84012-52f7-460b-b672-65feb3ca1697';
  const { data: m } = await supabase.from('business_missions').select('workspace_id').eq('id', missionId).single();
  console.log(`Mission Workspace ID: ${m?.workspace_id}`);
  
  if (m?.workspace_id) {
    const { data: w } = await supabase.from('workspaces').select('id, name, status, updated_at').eq('id', m.workspace_id).single();
    console.log(`Workspace details:`, w);
  }
}
run().catch(console.error);
