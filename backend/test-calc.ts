import parseExpression from 'cron-parser';
try {
  const trigger = { config: { cron: '* * * * *' } };
  const opts = trigger.config.timezone ? { tz: trigger.config.timezone } : {};
  const interval = (parseExpression as any).parseExpression ? (parseExpression as any).parseExpression(trigger.config.cron, opts) : (parseExpression as any)(trigger.config.cron, opts);
  console.log(interval.next().toISOString());
} catch (e: any) {
  console.error('ERROR:', e.message);
}
