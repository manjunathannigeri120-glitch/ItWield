const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');

const missionId = 'e6162ef5-6253-480c-b7f5-b45f582e474f';

async function check() {
    const { data: mission } = await supabase.from('business_missions').select('*').eq('id', missionId).single();
    console.log("MISSION:", mission.id, mission.status, mission.updated_at);
    
    const { data: plans } = await supabase.from('mission_plans').select('*').eq('mission_id', missionId).order('version', { ascending: false });
    console.log("\nPLANS:");
    console.table(plans.map(p => ({ id: p.id, status: p.status, version: p.version })));
    
    if (plans && plans.length > 0) {
        const { data: steps } = await supabase.from('mission_plan_steps').select('*').eq('plan_id', plans[0].id).order('step_order');
        console.log("\nSTEPS for plan", plans[0].id, ":");
        if (steps) console.table(steps.map(s => ({ step: s.step_type, auth: s.authorization_class, status: s.status })));
    }

    const { data: tasks } = await supabase.from('tasks').select('*').eq('mission_id', missionId).order('created_at', { ascending: true });
    console.log("\nTASKS:");
    if (tasks) console.table(tasks.map(t => ({ id: t.id, status: t.status, type: t.input?.task_type, error: String(t.error).substring(0, 50) })));
}

check().catch(console.error);
