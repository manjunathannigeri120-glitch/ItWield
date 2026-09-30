require('dotenv').config({path: 'backend/.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
    const { data: workspaces } = await supabase.from('workspaces').select('id');
    for (let ws of workspaces) {
        const { data: ceo } = await supabase.from('agents').select('id').eq('workspace_id', ws.id).eq('name', 'AI CEO').single();
        const { data: existingCoo } = await supabase.from('agents').select('id').eq('workspace_id', ws.id).eq('name', 'AI COO').single();
        if (ceo && !existingCoo) {
            await supabase.from('agents').insert({
                workspace_id: ws.id,
                name: 'AI COO',
                system_prompt: 'Company operations and coordination',
                capabilities: ['orchestrate_execution', 'manage_dependencies'],
                manager_id: ceo.id,
                status: 'IDLE'
            });
            console.log('Added AI COO to', ws.id);
        }
    }
}
run();
