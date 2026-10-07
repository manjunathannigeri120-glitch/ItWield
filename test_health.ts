import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials in backend/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHealth() {
  console.log("Checking Database Health...");
  
  const { data: workspaces, error: wsError } = await supabase.from('workspaces').select('id, name, status').limit(1);
  if (wsError) console.error("Workspaces Error:", wsError.message);
  else console.log("Found workspaces: " + (workspaces?.length || 0));

  const { data: tasks, error: tError } = await supabase.from('tasks').select('id, status, error').order('created_at', { ascending: false }).limit(5);
  if (tError) console.error("Tasks Error:", tError.message);
  else {
    console.log("Latest 5 Tasks:");
    tasks?.forEach(t => console.log("- Task " + t.id.slice(0,8) + ": " + t.status + (t.error ? " (" + t.error + ")" : "")));
  }

  const { data: goals, error: gError } = await supabase.from('business_goals').select('id, objective, status').order('created_at', { ascending: false }).limit(3);
  if (gError) console.error("Goals Error:", gError.message);
  else {
    console.log("Latest Goals:");
    goals?.forEach(g => console.log("- Goal: " + g.objective + " (" + g.status + ")"));
  }
}

checkHealth();
