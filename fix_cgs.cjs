const fs = require('fs');
let file = 'backend/src/services/CustomerGrowthService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("action_type: 'EXTERNAL_COMMUNICATION'", "action: 'EXTERNAL_COMMUNICATION'");

fs.writeFileSync(file, content);
console.log('Fixed CustomerGrowthService.ts action column');
