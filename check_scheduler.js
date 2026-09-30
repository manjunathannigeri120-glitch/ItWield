require('dotenv').config({path: 'backend/.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const { data, error } = await supabase.from('workflow_runs').select('*').limit(1);
  console.log(error || Object.keys(data[0] || {}));
}
run();
