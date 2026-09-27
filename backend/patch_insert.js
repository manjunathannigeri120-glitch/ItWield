const fs = require('fs');
let code = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');

const target = `          description: t.description,
          workflow_id: t.workflow_id,
          priority: t.priority || 'medium',`;
const replacement = `          description: t.description,
          workflow_run_id: t.workflow_id,
          priority: t.priority || 'medium',`;

const target_crlf = target.replace(/\n/g, '\r\n');
if (code.includes(target)) {
    code = code.replace(target, replacement);
} else if (code.includes(target_crlf)) {
    code = code.replace(target_crlf, replacement.replace(/\n/g, '\r\n'));
} else {
    console.log("Not found");
}
fs.writeFileSync('backend/src/services/CEOService.ts', code);
console.log("Done");
