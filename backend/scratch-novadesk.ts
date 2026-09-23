import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: novaWs } = await supabase.from('workspaces').select('id, name').eq('name', 'NovaDesk AI').single();
  const { data: ceo } = await supabase.from('agents').select('*').eq('workspace_id', novaWs.id).eq('name', 'AI CEO').single();
  
  const { data: tools } = await supabase.from('agent_tools').select('*').eq('agent_id', ceo.id);
  console.log('CEO tools:', tools);
}
main();
