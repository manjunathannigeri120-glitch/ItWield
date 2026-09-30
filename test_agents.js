require('dotenv').config({path: 'backend/.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const { data: ws } = await supabase.from('workspaces').select('id').limit(1);
  const { data: agents, error } = await supabase.from('agents').select('*').eq('workspace_id', ws[0].id);
  console.log(agents.length, error);
}
run();
