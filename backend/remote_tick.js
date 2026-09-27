require('ts-node').register();
const { CEOService } = require('./src/services/CEOService');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');

async function runTick() {
    console.log("Triggering CEOService.observeWorkspace...");
    await CEOService.observeWorkspace(supabase, '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3');
    console.log("observeWorkspace completed.");
}

runTick().catch(console.error);
