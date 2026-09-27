
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');

async function run() {
    console.log('--- MISSIONS ---');
    let m = await supabase.from('business_missions').select('*').in('id', ['e6162ef5-6253-480c-b7f5-b45f582e474f', '1ba84012-52f7-460b-b672-65feb3ca1697']);
    console.log(JSON.stringify(m.data, null, 2));

    console.log('\n--- AGENTS ---');
    let a = await supabase.from('agents').select('name, capabilities').in('name', ['Competitor Analyst', 'Builder Analyst', 'AI CTO']);
    console.log(JSON.stringify(a.data, null, 2));

    console.log('\n--- FAILED DATA_TRANSFORMATION TASKS ---');
    let t = await supabase.from('tasks').select('*').eq('status', 'FAILED').order('created_at', { ascending: false }).limit(20);
    console.log(JSON.stringify(t.data.filter(x => x.input?.task_type === 'DATA_TRANSFORMATION' || x.action === 'DATA_TRANSFORMATION'), null, 2));

    console.log('\n--- INCIDENTS 429 ---');
    let i = await supabase.from('incidents').select('*').ilike('title', '%429%').limit(5);
    console.log(JSON.stringify(i.data, null, 2));
    
    console.log('\n--- MEMORY ---');
    let mem = await supabase.from('company_memory').select('*').eq('category', 'STRATEGIC_CONTEXT');
    console.log(JSON.stringify(mem.data, null, 2));
    
    console.log('\n--- GOALS ---');
    let goals = await supabase.from('business_goals').select('*');
    console.log(JSON.stringify(goals.data, null, 2));
}
run().catch(console.error);

