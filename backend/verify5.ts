import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function run() {
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
  console.log('fifteenMinsAgo:', fifteenMinsAgo);
  const { data: stuckWs, error } = await supabase
    .from('workspaces')
    .select('id, name, updated_at')
    .in('status', ['evaluating', 'ceo_evaluating'])
    .lt('updated_at', fifteenMinsAgo);
  
  if (error) console.error(error);
  console.log('Stuck Workspaces Query Result:', stuckWs);
}
run().catch(console.error);
