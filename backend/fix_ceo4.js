const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'CEOService.ts');
const lines = fs.readFileSync(file, 'utf8').split('\n');

const outLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// Priority logic')) {
        skip = true;
    }
    if (!skip) {
        outLines.push(lines[i]);
    }
    if (skip && lines[i].includes("await supabase.from('business_goals').update({ priority }).eq('id', goal.id);")) {
        // Skip the closing brace as well
        if (lines[i+1] && lines[i+1].includes('}')) {
            i++; 
        }
        skip = false;
    }
}

fs.writeFileSync(file, outLines.join('\n'));
