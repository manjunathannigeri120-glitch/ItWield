const fs = require('fs');
const file = 'backend/src/services/MissionProgressService.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `      for (const t of (tasks || [])) {
        work.planned++;
        if (['PENDING', 'ASSIGNED'].includes(t.status)) work.pending++;
        else if (t.status === 'RUNNING') work.running++;
        else if (t.status === 'COMPLETED') work.completed++;
        else if (t.status === 'FAILED') {
          work.failed++;
          if (!mostRecentErrorTask || new Date(t.updated_at) > new Date(mostRecentErrorTask.updated_at)) {
            mostRecentErrorTask = t;
          }
        }
        else if (['BLOCKED', 'ESCALATED'].includes(t.status)) work.blocked++;`;

const replacement = `      for (const t of (tasks || [])) {
        work.planned++;
        if (['PENDING', 'ASSIGNED'].includes(t.status)) work.pending++;
        else if (t.status === 'RUNNING') work.running++;
        else if (t.status === 'COMPLETED') work.completed++;
        else if (['FAILED', 'BLOCKED', 'ESCALATED'].includes(t.status)) {
          if (t.status === 'FAILED') work.failed++;
          if (['BLOCKED', 'ESCALATED'].includes(t.status)) work.blocked++;
          
          if (!mostRecentErrorTask || new Date(t.updated_at) > new Date(mostRecentErrorTask.updated_at)) {
            mostRecentErrorTask = t;
          }
        }`;

let replaced = false;
if (code.includes(target)) {
    code = code.replace(target, replacement);
    replaced = true;
} else {
    // Try with CRLF
    const t2 = target.replace(/\n/g, '\r\n');
    const r2 = replacement.replace(/\n/g, '\r\n');
    if (code.includes(t2)) {
        code = code.replace(t2, r2);
        replaced = true;
    }
}

if (replaced) {
    fs.writeFileSync(file, code);
    console.log('Successfully patched MissionProgressService.ts');
} else {
    console.log('Target string not found');
}
