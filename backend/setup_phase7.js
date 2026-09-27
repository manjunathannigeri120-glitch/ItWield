const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
async function fix() {
    const { data: steps } = await supabase.from('mission_plan_steps').select('*').eq('mission_id', 'e6162ef5-6253-480c-b7f5-b45f582e474f').eq('step_order', 2);
    for (const step of steps) {
        await supabase.from('mission_plan_steps').update({ status: 'BLOCKED' }).eq('id', step.id);
        console.log("Updated step:", step.id);
    }
}
fix();
