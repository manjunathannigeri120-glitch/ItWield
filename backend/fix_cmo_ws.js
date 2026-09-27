const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');

async function fixAgent() {
    const { data: agent } = await supabase.from('agents').select('*').eq('name', 'AI CMO').eq('workspace_id', '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3').single();
    if (agent) {
        const caps = new Set(agent.capabilities || []);
        caps.add('LEAD_RESEARCH');
        await supabase.from('agents').update({ capabilities: Array.from(caps) }).eq('id', agent.id);
        console.log("Added LEAD_RESEARCH to AI CMO in workspace");
    }
}

fixAgent().catch(console.error);
