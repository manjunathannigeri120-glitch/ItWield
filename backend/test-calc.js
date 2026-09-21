const cp = require('cron-parser');
try {
  const trigger = { config: { cron: '* * * * *' } };
  const interval = cp.parseExpression(trigger.config.cron);
  console.log(interval.next().toISOString());
} catch (e) {
  console.error('ERROR:', e.message);
}
