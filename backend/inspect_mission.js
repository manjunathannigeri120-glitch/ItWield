require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function inspect() {
  const missionId = 'e6162ef5-6253-480c-b7f5-b45f582e474f';
  console.log(`Inspecting mission: ${missionId}`);
  
  const { data: mission } = await supabase.from('business_missions').select('*').eq('id', missionId).single();
  console.log("Mission Status:", mission.status);
  
  const { data: plans } = await supabase.from('mission_plans').select('*').eq('mission_id', missionId).order('version', { ascending: false }).limit(1);
  const plan = plans[0];
  console.log("Plan Status:", plan.status);
  
  const { data: steps } = await supabase.from('mission_plan_steps').select('*').eq('plan_id', plan.id).order('step_order', { ascending: true });
  
  const step1 = steps.find(s => s.step_order === 1);
  console.log("Step 1:", step1.title, "Status:", step1.status, "Capability:", step1.required_capability, "Type:", step1.step_type);
  
  const { data: tasks } = await supabase.from('tasks').select('*').eq('mission_id', missionId).eq('step_id', step1.id);
  console.log(`Tasks for Step 1 (${tasks.length}):`);
  tasks.forEach(t => console.log(`  - Task ${t.id}: ${t.status} (assigned to: ${t.assigned_agent_id})`));
}

inspect().catch(console.error);
