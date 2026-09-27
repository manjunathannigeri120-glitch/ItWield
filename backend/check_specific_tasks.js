const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function run() {
  const { data, error } = await supabase.from('tasks').select('title, status, created_at').ilike('title', '%CTO%').order('created_at', { ascending: false }).limit(10);
  console.log('CTO:', JSON.stringify(data, null, 2));
  const { data: d2 } = await supabase.from('tasks').select('title, status, created_at').ilike('title', '%Root Cause%').order('created_at', { ascending: false }).limit(10);
  console.log('Root Cause:', JSON.stringify(d2, null, 2));
  const { data: d3 } = await supabase.from('tasks').select('title, status, created_at').ilike('title', '%Skill%').order('created_at', { ascending: false }).limit(10);
  console.log('Skill:', JSON.stringify(d3, null, 2));
}
run().catch(console.error);
