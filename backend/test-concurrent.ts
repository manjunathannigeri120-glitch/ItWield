import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log('Testing Concurrent Scheduler Requests...');
  const headers = { Authorization: `Bearer ${process.env.SCHEDULER_SECRET || 'dev-secret'}` };
  
  // Fire 5 requests simultaneously
  const promises = Array(5).fill(0).map(() => axios.post('http://127.0.0.1:3000/api/v1/scheduler/tick', {}, { headers }).catch(e => e.response));
  
  const results = await Promise.all(promises);
  const triggeredCounts = results.map(r => r.data?.triggered);
  console.log('Triggered counts per request:', triggeredCounts);
  
  const totalTriggered = triggeredCounts.reduce((a, b) => a + (b || 0), 0);
  console.log('Total triggered:', totalTriggered);
}
run();
