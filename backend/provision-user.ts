import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function provision() {
  console.log('Provisioning test environment...');
  
  // 1. Ensure user exists
  const email = 'admin@itwield.com';
  const password = 'Password123!';
  
  let userId;
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  const existing = users.find(u => u.email === email);
  
  if (existing) {
    console.log('User already exists, updating password...');
    await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    userId = existing.id;
  } else {
    console.log('Creating user...');
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) throw error;
    userId = newUser.user.id;
  }

  // 2. Ensure Profile exists
  await supabase.from('profiles').upsert({ id: userId, email, full_name: 'Admin' });

  // 3. Ensure the hardcoded Workspace exists (00000000-0000-0000-0000-000000000000)
  const HARDCODED_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';
  const { data: ws } = await supabase.from('workspaces').select('id').eq('id', HARDCODED_WORKSPACE_ID).single();
  
  if (!ws) {
    console.log('Creating hardcoded workspace...');
    await supabase.from('workspaces').insert({
      id: HARDCODED_WORKSPACE_ID,
      name: 'Acme SaaS',
      owner_id: userId,
      industry: 'Software',
      business_model: 'B2B',
      company_goals: 'Increase ARR, improve stability'
    });
  } else {
    console.log('Updating hardcoded workspace owner...');
    await supabase.from('workspaces').update({ owner_id: userId, name: 'Acme SaaS' }).eq('id', HARDCODED_WORKSPACE_ID);
  }

  // 4. Ensure workspace member
  await supabase.from('workspace_members').upsert({
    workspace_id: HARDCODED_WORKSPACE_ID,
    user_id: userId,
    role: 'owner'
  });

  // 5. Ensure at least one agent exists in this workspace so CEO can delegate
  const { data: agents } = await supabase.from('agents').select('id').eq('workspace_id', HARDCODED_WORKSPACE_ID);
  if (!agents || agents.length === 0) {
    console.log('Creating default AI worker...');
    await supabase.from('agents').insert({
      workspace_id: HARDCODED_WORKSPACE_ID,
      name: 'Senior Developer',
      role: 'Engineer',
      status: 'idle'
    });
  }

  console.log('--- PROVISION COMPLETE ---');
  console.log('Email:', email);
  console.log('Password:', password);
}

provision().catch(console.error);
