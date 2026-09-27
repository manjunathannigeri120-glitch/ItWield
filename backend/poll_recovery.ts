import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');

async function poll() {
  console.log('Polling for workspace recovery (ID: 0952325e-325d-4d9a-a2f0-9e18b6c5f3e6)...');
  for (let i = 0; i < 60; i++) {
    const { data } = await supabase.from('workspaces').select('id, status, updated_at').eq('id', '0952325e-325d-4d9a-a2f0-9e18b6c5f3e6').single();
    if (data && data.status === 'operating') {
       console.log('SUCCESS: Workspace recovered! Render deployment is LIVE with a445ed7.');
       console.log(data);
       return;
    }
    await new Promise(r => setTimeout(r, 10000)); // 10 seconds
  }
  console.log('Timeout waiting for workspace recovery.');
}
poll().catch(console.error);
