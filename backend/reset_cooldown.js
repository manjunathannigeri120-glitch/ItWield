require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function resetCooldown() {
  const wsId = '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3'; 
  console.log(`Resetting cooldown for workspace: ${wsId}`);
  
  await supabase.from('workspaces').update({ provider_rate_limit_until: null, status: 'active' }).eq('id', wsId);
  console.log("Cooldown reset.");
}

resetCooldown().catch(console.error);
