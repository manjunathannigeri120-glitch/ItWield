import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function test() {
  const { data: w } = await supabase.from('workspaces').select('id').limit(1).single();
  if(!w) return console.log('No workspace');
  
  const { data: a } = await supabase.from('agents').select('id, name, workspace_id').eq('workspace_id', w.id).limit(1).single();
  if(!a) return console.log('No agents');
  console.log('Testing chat for agent', a.id);
  
  // Try to call backend chat API directly
  // we are in the terminal, so we can't easily hit localhost if it's not running or requires auth headers
}
test();
