require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function inspect() {
  const missionId = 'e6162ef5-6253-480c-b7f5-b45f582e474f';
  console.log(`Inspecting mission: ${missionId}`);
  
  const { data: tasks } = await supabase.from('tasks').select('*').eq('mission_id', missionId).order('created_at', { ascending: false });
  console.log(`Tasks for Mission (${tasks.length}):`);
  tasks.forEach(t => console.log(`  - Task ${t.id}: ${t.status} (type: ${t.input?.task_type}) (assigned to: ${t.assigned_agent_id})`));
}

inspect().catch(console.error);
