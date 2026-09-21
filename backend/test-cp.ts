import * as cp from 'cron-parser';
console.log('cp has:', Object.keys(cp));
console.log('cp.parseExpression exists:', !!(cp as any).parseExpression);
