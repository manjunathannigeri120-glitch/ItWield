const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://rdwredkyhinhcspviqsl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI'
);
async function check() {
  const { data: p } = await supabase.from('mission_plan_steps').select('plan_id, step_order, title, status, step_type, authorization_class').eq('mission_id', 'e6162ef5-6253-480c-b7f5-b45f582e474f').order('step_order');
  console.log('All Steps for mission:', p);
}
check();
