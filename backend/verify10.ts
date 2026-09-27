import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function run() {
  const workspaceId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3';
  const { data: events } = await supabase.from('task_events').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(5);
  console.log('Task events:');
  events?.forEach(e => console.log(`${e.created_at} - ${e.event_type} - ${JSON.stringify(e.details)}`));
  
  const { data: inc } = await supabase.from('incidents').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(5);
  console.log('Incidents:');
  inc?.forEach(e => console.log(`${e.created_at} - ${e.type} - ${e.title}`));
}
run().catch(console.error);
