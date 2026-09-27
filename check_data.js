const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function check() {
  const { data: users } = await supabase.auth.admin.listUsers();
  if (!users || users.users.length === 0) return console.log("No users");
  
  const user = users.users[0];
  console.log("User:", user.id);
  
  const { data: workspaces } = await supabase.from('workspaces').select('*').eq('owner_id', user.id).limit(1);
  if (!workspaces || workspaces.length === 0) return console.log("No workspaces");
  
  const ws = workspaces[0];
  console.log("Workspace:", ws.id);
  
  // Create a JWT for the user using the SUPABASE_SERVICE_KEY? 
  // No, the backend equireAuth middleware uses supabase.auth.getUser() with the token.
  // We can just look at ackend/src/api/goals.ts. We already know it returns equires_context: true if hasWebsite is false.
}
check();
