const fs = require('fs');
const file = 'backend/src/services/MissionProgressService.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /else if\s*\(\s*t\.status === 'FAILED'\s*\)\s*\{\s*work\.failed\+\+;\s*if\s*\(\!mostRecentErrorTask\s*\|\|\s*new\s*Date\(t\.updated_at\)\s*>\s*new\s*Date\(mostRecentErrorTask\.updated_at\)\)\s*\{\s*mostRecentErrorTask\s*=\s*t;\s*\}\s*\}\s*else if\s*\(\['BLOCKED',\s*'ESCALATED'\]\.includes\(t\.status\)\)\s*work\.blocked\+\+;/g;

const replacement = `else if (['FAILED', 'BLOCKED', 'ESCALATED'].includes(t.status)) {
        if (t.status === 'FAILED') work.failed++;
        if (['BLOCKED', 'ESCALATED'].includes(t.status)) work.blocked++;
        
        if (!mostRecentErrorTask || new Date(t.updated_at) > new Date(mostRecentErrorTask.updated_at)) {
          mostRecentErrorTask = t;
        }
      }`;

const patched = code.replace(regex, replacement);

if (patched !== code) {
    fs.writeFileSync(file, patched);
    console.log('Successfully patched MissionProgressService.ts');
} else {
    console.log('Target string not found');
}
