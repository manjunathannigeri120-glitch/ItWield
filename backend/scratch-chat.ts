import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { AgentRuntime } from './src/agents/runtime';
dotenv.config();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);

  // Get NovaDesk CEO
  const { data: workspaces } = await supabase.from('workspaces').select('id, name').eq('name', 'NovaDesk AI');
  const ws = workspaces?.[0];
  if (!ws) return console.log('No ws');

  const { data: ceo } = await supabase.from('agents').select('*').eq('workspace_id', ws.id).eq('name', 'AI CEO').single();
  if (!ceo) return console.log('No ceo');

  // Create conversation manually
  const { data: conv } = await supabase.from('conversations').insert({
    agent_id: ceo.id,
    user_id: 'd7c54b95-5172-4879-acea-e5662df9e1a3', // admin user from before
    title: 'Test chat'
  }).select().single();

  console.log('Running chat for CEO ID:', ceo.id);
  try {
    const res = await AgentRuntime.runChat(
      supabase,
      ceo,
      conv.id,
      'Hello CEO, what is our status?',
      'd7c54b95-5172-4879-acea-e5662df9e1a3'
    );
    console.log('Chat response:', res);
  } catch (e: any) {
    console.error('Chat error:', e.message);
  }
}
main();
