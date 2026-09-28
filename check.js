const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if(!supabaseUrl || !supabaseKey) {
  console.log('No supabase config found');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);
supabase.from('company_systems').select('*').then(({ data, error }) => {
  if (error) console.log('Error', error);
  else console.log('Company Systems:', JSON.stringify(data, null, 2));
});
