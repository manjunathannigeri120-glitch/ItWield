import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function test() {
  const { data: w } = await supabase.from('workspaces').select('id').limit(1).single();
  if(!w) return console.log('no workspace');
  const { data: a } = await supabase.from('agents').select('id').eq('workspace_id', w.id).ilike('name', '%CEO%').limit(1).single();
  
  if(!a) return console.log('no ceo');

  console.log('Sending message to CEO', a.id);
  const res = await fetch('http://localhost:3000/api/v1/agents/' + a.id + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'hello', conversationId: 'test-123' })
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
test();
