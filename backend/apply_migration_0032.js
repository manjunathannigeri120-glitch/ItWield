require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log("Applying migration 0032 (DATA_TRANSFORMATION)...");
  
  const { data: agents, error: fetchError } = await supabase.from('agents').select('*').eq('name', 'Builder Analyst');
  if (fetchError) {
    console.error("Error fetching Builder Analyst:", fetchError);
    return;
  }
  
  if (!agents || agents.length === 0) {
    console.log("No Builder Analyst found. Migration skipped safely.");
    return;
  }
  
  let updatedCount = 0;
  for (const agent of agents) {
    const caps = agent.capabilities || [];
    if (!caps.includes('DATA_TRANSFORMATION')) {
      const newCaps = [...caps, 'DATA_TRANSFORMATION'];
      const { error: updateError } = await supabase.from('agents').update({ capabilities: newCaps }).eq('id', agent.id);
      if (updateError) {
        console.error("Error updating agent:", agent.id, updateError);
      } else {
        console.log(`Updated capabilities for Builder Analyst (${agent.id})`);
        updatedCount++;
      }
    } else {
      console.log(`Builder Analyst (${agent.id}) already has DATA_TRANSFORMATION. (Idempotent)`);
    }
  }
  
  console.log(`Migration 0032 completed. Updated ${updatedCount} agents.`);
}

runMigration().catch(console.error);
