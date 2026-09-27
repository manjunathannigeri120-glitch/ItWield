import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');

async function run() {
  const workspaceId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3';
  const { data, error } = await supabase.from('workspaces')
      .update({ status: 'ceo_evaluating' })
      .eq('id', workspaceId)
      .eq('status', 'operating')
      .select('id')
      .single();
  console.log('Data:', data);
  console.log('Error:', error);
}
run().catch(console.error);
