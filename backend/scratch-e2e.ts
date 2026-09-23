import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const tempEmail = 'testchat2@nova.com';
  let userId;
  const { data: existingUser } = await supabase.auth.admin.createUser({
    email: tempEmail,
    password: 'Password123!',
    email_confirm: true
  });
  
  const authClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!);
  const { data: loginData, error: loginErr } = await authClient.auth.signInWithPassword({
    email: tempEmail,
    password: 'Password123!'
  });
  const jwt = loginData?.session?.access_token;
  userId = loginData?.user?.id;

  const { data: ws, error: wsError } = await supabase.from('workspaces').insert({
    name: 'Test Chat WS ' + Date.now(),
    owner_id: userId,
    status: 'operating'
  }).select().single();
  
  if (wsError) return console.error('WS error:', wsError);

  const { data: ceo, error: ceoError } = await supabase.from('agents').insert({
    workspace_id: ws.id,
    name: 'AI CEO',
    model: 'gpt-4o-mini',
    system_prompt: 'Test prompt',
    status: 'idle'
  }).select().single();

  if (ceoError) return console.error('CEO Error:', ceoError);
  console.log('Sending request to', ceo.id);
  
  try {
    const res = await fetch(`http://localhost:3000/api/v1/agents/${ceo.id}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ message: 'Hello' })
    });
    const data = await res.json();
    console.log('API Status:', res.status);
    console.log('API Response:', data);
  } catch (e: any) {
    console.error('Fetch error:', e);
  }
}
main();
