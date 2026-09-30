const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'tests', 'v511_multi_executive_coordination.test.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /expect\(coord\.current_state\.COO\)\.toBe\('DELEGATED_TO_CMO'\);/g,
    `console.log("Current state:", coord.current_state);
        expect(coord.current_state.COO).toBe('DELEGATED_TO_CMO');`
);

fs.writeFileSync(file, content);
