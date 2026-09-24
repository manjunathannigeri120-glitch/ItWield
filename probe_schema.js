const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.log(`[Table: ${tableName}] ERROR: ${error.message} (Code: ${error.code})`);
  } else {
    console.log(`[Table: ${tableName}] EXISTS`);
  }
}

async function run() {
  console.log('--- Probing Tables ---');
  await checkTable('workspaces');
  await checkTable('workspace_members');
  await checkTable('tasks');
  await checkTable('business_missions');
  await checkTable('mission_events');
  
  console.log('\n--- Probing columns in tasks (mission_id) ---');
  const { data: tasks, error: tasksErr } = await supabase.from('tasks').select('mission_id').limit(1);
  if (tasksErr) {
    console.log(`[Column: tasks.mission_id] ERROR: ${tasksErr.message} (Code: ${tasksErr.code})`);
  } else {
    console.log(`[Column: tasks.mission_id] EXISTS`);
  }
}

run();
