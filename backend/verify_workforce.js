require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// We need to use WorkforceIntegrityService to simulate exactly what CEOService does
const { WorkforceIntegrityService } = require('./dist/services/WorkforceIntegrityService.js');

async function verify() {
  const wsId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3';
  console.log("Verifying workspace:", wsId);
  
  const worker = await WorkforceIntegrityService.findCapableWorker(supabase, wsId, 'DATA_TRANSFORMATION');
  
  if (worker) {
    console.log("Found capable worker:");
    console.log("  Name:", worker.name);
    console.log("  Role:", worker.role);
    console.log("  ID:", worker.id);
    console.log("  Capabilities:", worker.capabilities);
  } else {
    console.log("No capable worker found.");
  }
}

verify().catch(console.error);
