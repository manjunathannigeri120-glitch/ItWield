require('dotenv').config({path: 'backend/.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'manjunathannigeri120@gmail.com'
  });
  console.log(data, error);
}
run();
