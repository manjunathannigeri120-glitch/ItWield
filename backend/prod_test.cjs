require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
  console.log('Creating test user via Admin API...');
  const email = `test_onboarding_${Date.now()}@example.com`;
  const { data: authData, error: authErr } = await s.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true
  });

  if (authErr) {
    console.log('Create error:', authErr);
    return;
  }

  // Now sign in with anon key to get the JWT
  const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data: loginData } = await anonClient.auth.signInWithPassword({
    email,
    password: 'Password123!'
  });

  const token = loginData.session.access_token;
  console.log('Got JWT. Testing POST /workspaces...');

  const api = axios.create({
    baseURL: 'https://api.itwield.com/api/v1',
    headers: { Authorization: `Bearer ${token}` }
  });

  try {
    console.log('Step 1: Create Workspace');
    const wsRes = await api.post('/workspaces', { name: 'Test WS' });
    const wsId = wsRes.data.id;
    console.log('Workspace Created:', wsId);

    console.log('Step 2: Analyze Company');
    await api.post(`/workspaces/${wsId}/analyze-company`, {
      name: 'Test WS',
      industry: 'Software',
      target_customer: 'Devs',
      primary_market: 'Global',
      goals: 'Get customers',
      biggest_problems: 'Bugs'
    });
    console.log('Analyze Success!');

    console.log('Step 3: Activate');
    await api.post(`/workspaces/${wsId}/activate`);
    console.log('Activate Success!');

  } catch (e) {
    console.error('API Error:', e.response?.status, e.response?.data);
  }
}
test();
