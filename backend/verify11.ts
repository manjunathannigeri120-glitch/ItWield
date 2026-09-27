import { createClient } from '@supabase/supabase-js';
import { IntelligenceService } from './src/services/IntelligenceService';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk5NTg4MSwiZXhwIjoyMDk0NTcxODgxfQ.1XXX1XRxn19QKHgOi4M5QHivTBdiVwz3PhKuOBiuzAI');

async function run() {
  const workspaceId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3';
  try {
     console.log('Generating snapshot...');
     const snapshot = await IntelligenceService.generateSnapshot(supabase, workspaceId);
     console.log('Snapshot generated.');
  } catch (e) {
     console.error('Error generating snapshot:', e);
  }
}
run().catch(console.error);
