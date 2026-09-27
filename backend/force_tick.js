const { createClient } = require('@supabase/supabase-js');
const { CEOService } = require('./src/services/CEOService');
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');

async function forceTick() {
    await supabase.from('incidents').delete().eq('workspace_id', '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3').eq('type', 'PROVIDER_RATE_LIMIT');
    console.log("Cleared incidents.");
    
    // Simulate web_search connection unavailable
    console.log("Triggering observe...");
    await CEOService.observeWorkspace(supabase, '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3');
    console.log("Done.");
}

forceTick().catch(console.error);
