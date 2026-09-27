import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rdwredkyhinhcspviqsl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI'
);

async function verify() {
  const missionId = '1ba84012-52f7-460b-b672-65feb3ca1697';
  
  // 1. Workspace
  const { data: workspaces } = await supabase.from('workspaces').select('*').eq('name', 'NovaDesk AI');
  const workspace = workspaces?.[0];
  console.log('--- WORKSPACE ---');
  console.log(workspace ? `ID: ${workspace.id}, Status: ${workspace.status}` : 'Not found');

  if (!workspace) return;

  // 2. Mission
  const { data: mission } = await supabase.from('business_missions').select('*').eq('id', missionId).single();
  console.log('--- MISSION ---');
  console.log(mission ? `Status: ${mission.status}` : 'Not found');

  // 3. Mission Plan Steps
  const { data: steps } = await supabase.from('mission_plan_steps').select('*').eq('mission_id', missionId).order('step_order', { ascending: true });
  console.log('--- MISSION PLAN STEPS ---');
  steps?.forEach(s => console.log(`[${s.id}] ${s.step_type}: ${s.status}`));

  // 4. Agents
  const { data: agents } = await supabase.from('agents').select('*').eq('workspace_id', workspace.id);
  const leadResearcher = agents?.find(a => a.name === 'Lead Researcher' || a.role === 'Lead Researcher' || (a.capabilities && a.capabilities.includes('LEAD_RESEARCH')));
  const cmo = agents?.find(a => a.name === 'AI CMO' || a.role === 'CMO');
  console.log('--- AGENTS ---');
  console.log(`Lead Researcher ID: ${leadResearcher?.id}`);
  console.log(`CMO ID: ${cmo?.id}`);

  // 5. Tasks
  const { data: tasks } = await supabase.from('tasks').select('*').eq('mission_id', missionId).order('created_at', { ascending: false });
  console.log('--- TASKS ---');
  tasks?.forEach(t => {
    console.log(`ID: ${t.id} | Title: ${t.title} | Status: ${t.status} | Assigned To: ${t.assigned_agent_id} | Input Action: ${t.input?.task_type}`);
    if (t.output) console.log(`  Output: ${JSON.stringify(t.output).substring(0, 200)}`);
  });

  // 6. Events
  const { data: events } = await supabase.from('task_events').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(10);
  console.log('--- RECENT TASK EVENTS ---');
  events?.forEach(e => console.log(`${e.created_at} - ${e.event_type} - ${JSON.stringify(e.details).substring(0,100)}`));

  // 7. Mission Events
  const { data: missionEvents } = await supabase.from('mission_events').select('*').eq('mission_id', missionId).order('created_at', { ascending: false }).limit(10);
  console.log('--- MISSION EVENTS ---');
  missionEvents?.forEach(e => console.log(`${e.created_at} - ${e.event_type} - ${JSON.stringify(e.details).substring(0,100)}`));
}

verify().catch(console.error);
