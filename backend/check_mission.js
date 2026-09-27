require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data, error } = await supabase.from('business_missions').select('status').eq('id', '1ba84012-52f7-460b-b672-65feb3ca1697');
  console.log("Mission:", { data, error });
}
check();
