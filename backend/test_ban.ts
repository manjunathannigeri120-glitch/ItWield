import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');

async function test() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find(u => u.email === 'test1790421437432@example.com');
  
  if (!user) return console.log('User not found');
  console.log('Before ban_duration:', user.banned_until);

  const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(user.id, { ban_duration: '87600h' });
  if (updateErr) throw updateErr;

  console.log('After ban_duration:', updated.user.banned_until);
}
test();
