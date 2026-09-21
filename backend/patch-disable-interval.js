const fs = require('fs');

let content = fs.readFileSync('src/workflows/scheduler.ts', 'utf8');

// Disable setInterval logic inside startScheduler
content = content.replace(
  /export function startScheduler\(\) \{[\\s\\S]*?console\.log\('\\[Scheduler\\] Started'\);\\n\}/,
  \export function startScheduler() {
  console.log('[Scheduler] Internal polling disabled. Please configure an external cron job to hit POST /api/v1/scheduler/tick');
}\
);

fs.writeFileSync('src/workflows/scheduler.ts', content);
console.log('Scheduler interval disabled');
