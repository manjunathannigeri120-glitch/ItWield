require('dotenv').config({path: 'backend/.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const { data, error } = await supabase.from('workspaces').update({ status: 'ACTIVE' }).neq('status', 'ACTIVE');
  console.log(data, error);
}
run();
