const { getServiceSupabase } = require('./src/db/supabaseClient');
const { CEOService } = require('./src/services/CEOService');
const { IntelligenceService } = require('./src/services/IntelligenceService');

async function test() {
   const supabase = getServiceSupabase();
   const { data: workspaces } = await supabase.from('workspaces').select('id, status');
   console.log('Workspaces:', workspaces);
}
test();
