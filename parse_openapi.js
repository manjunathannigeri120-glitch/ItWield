const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('openapi.json', 'utf8'));
const wsSchema = spec.definitions.workspaces;
console.log(JSON.stringify(wsSchema.properties, null, 2));
