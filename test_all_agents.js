require('dotenv').config({path: 'backend/.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const { data: agents, error } = await supabase.from('agents').select('name');
  console.log(agents, error);
}
run();
