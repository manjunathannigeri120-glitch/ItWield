require('dotenv').config();
const { getServiceSupabase } = require('./src/db/supabaseClient');
const { CEOService } = require('./src/services/CEOService');
const supabase = getServiceSupabase();

async function test() {
  try {
    const res = await CEOService.run(supabase, '579f6d39-72ad-4e29-8621-5d0b1ab4e3e3', 'SCHEDULED_OBSERVATION:LEAD_RESEARCH', 'service_role', undefined, undefined, '1ba84012-52f7-460b-b672-65feb3ca1697');
    console.log("Success:", res);
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
