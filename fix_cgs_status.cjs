const fs = require('fs');
let file = 'backend/src/services/CustomerGrowthService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    "status: 'PENDING',",
    "status: 'PENDING_APPROVAL',"
);

fs.writeFileSync(file, content);
console.log('Fixed CustomerGrowthService.ts status column');
