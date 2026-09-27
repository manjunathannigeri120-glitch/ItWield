const fs = require('fs');
let c = fs.readFileSync('src/services/CEOService.ts', 'utf8');
c = c.replace(/status: 'ceo_evaluating'/g, "status: 'evaluating'");
fs.writeFileSync('src/services/CEOService.ts', c);

let s = fs.readFileSync('src/api/scheduler.ts', 'utf8');
s = s.replace(/\['evaluating', 'ceo_evaluating'\]/g, "['evaluating']");
fs.writeFileSync('src/api/scheduler.ts', s);
