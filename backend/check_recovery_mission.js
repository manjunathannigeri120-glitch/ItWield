const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const missionId = 'e6162ef5-6253-480c-b7f5-b45f582e474f';

async function check() {
    const { data: plans } = await supabase.from('mission_plans').select('*').eq('mission_id', missionId).order('version', { ascending: false });
    console.log("PLANS:", plans.map(p => ({ id: p.id, status: p.status, version: p.version })));
    
    if (plans && plans.length > 0) {
        const { data: steps } = await supabase.from('mission_plan_steps').select('*').eq('plan_id', plans[0].id).order('order_index');
        console.log("STEPS:");
        console.table(steps.map(s => ({ step: s.step_type, status: s.status, auth: s.authorization_class })));
    }

    const { data: tasks } = await supabase.from('tasks').select('*').eq('mission_id', missionId).order('created_at', { ascending: false });
    console.log("TASKS:");
    console.table(tasks.map(t => ({ id: t.id, status: t.status, error: t.error, type: t.input?.task_type })));
}

check();
