import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY!; // Wait, I need an auth token
  const serviceClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY!);

  // Find a user who is in NovaDesk AI workspace
  const { data: wsData } = await serviceClient.from('workspaces').select('owner_id').eq('name', 'NovaDesk AI').single();
  const ownerId = wsData.owner_id;

  // Let's check RLS by making a request using the service client but with the user's role
  // We can't easily do this without a JWT, but we can query the policies.
  const { data: policies, error } = await serviceClient.from('pg_policies').select('*').in('tablename', ['conversations', 'messages', 'agent_runs']);
  console.log('Policies for chat tables:', policies || error);
}

main().catch(console.error);
