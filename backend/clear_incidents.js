require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function clearIncidents() {
  const wsId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3'; 
  console.log(`Clearing rate limits in incidents for workspace: ${wsId}`);
  
  await supabase.from('incidents').delete().eq('workspace_id', wsId).eq('type', 'PROVIDER_RATE_LIMIT');
  console.log("Incidents cleared.");
}

clearIncidents().catch(console.error);
