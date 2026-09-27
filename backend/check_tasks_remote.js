const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');
const missionId = 'e6162ef5-6253-480c-b7f5-b45f582e474f';

async function check() {
    const { data: tasks } = await supabase.from('tasks').select('*').eq('mission_id', missionId).order('updated_at', { ascending: false });
    console.table(tasks.map(t => ({ id: t.id, status: t.status, type: t.input?.task_type, updated: t.updated_at, error: String(t.error).substring(0, 50) })));
}
check().catch(console.error);
