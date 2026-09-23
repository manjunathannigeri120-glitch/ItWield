import dotenv from 'dotenv';
dotenv.config();

async function runSchedulerTick() {
  const backendUrl = process.env.BACKEND_URL;
  const schedulerSecret = process.env.SCHEDULER_SECRET;

  if (!backendUrl) {
    console.error('Error: BACKEND_URL environment variable is missing.');
    process.exit(1);
  }

  if (!schedulerSecret) {
    console.error('Error: SCHEDULER_SECRET environment variable is missing.');
    process.exit(1);
  }

  // Ensure there's no trailing slash to avoid double slashes in URL
  const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
  const endpoint = `${baseUrl}/api/v1/scheduler/tick`;

  console.log(`[Scheduler Tick] Initiating tick against ${endpoint}...`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schedulerSecret}`
      }
    });

    if (!response.ok) {
      console.error(`[Scheduler Tick] Request failed with HTTP status ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`[Scheduler Tick] Response body: ${text}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log(`[Scheduler Tick] Success. Status: ${response.status}. Triggered workflows: ${data.triggered ?? 0}`);
    process.exit(0);
  } catch (error) {
    console.error(`[Scheduler Tick] Network or execution error:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

runSchedulerTick();
