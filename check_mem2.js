const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data } = await supabase.from('company_memory').select('*');
  console.log(JSON.stringify(data, null, 2));
}
check();
