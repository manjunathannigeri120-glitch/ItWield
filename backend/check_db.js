require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data: ws } = await supabase.from('workspaces').select('id, status');
  console.log("Workspaces:", ws);
  const { data: m } = await supabase.from('business_missions').select('id, type, status, workspace_id');
  console.log("Missions:", m);
  const { data: tasks } = await supabase.from('tasks').select('id, title, status, execution_lease_until, mission_id');
  console.log("Tasks:", tasks);
  const { data: mps } = await supabase.from('mission_plan_steps').select('id, status, step_type');
  console.log("Plan Steps:", mps);
}
check();
