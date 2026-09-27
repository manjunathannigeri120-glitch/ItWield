require('dotenv').config({ path: 'frontend/.env' });
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  // Login as a user
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'founder@itwield.com',
    password: 'password123'
  });
  
  if (authError) {
    console.log("Could not login:", authError);
    // Let's try to find an existing user or just bypass auth for the test by fetching workspaces with service role.
  }
}
run();
