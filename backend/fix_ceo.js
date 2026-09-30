const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'CEOService.ts');
let content = fs.readFileSync(file, 'utf8');

// add imports if missing
if (!content.includes('import { COOService }')) {
    content = "import { COOService } from './COOService';\n" + content;
}
if (!content.includes('import { CompanyMemoryService }')) {
    content = "import { CompanyMemoryService } from './CompanyMemoryService';\n" + content;
}

// remove require
content = content.replace(/const { CompanyMemoryService } = require\('\.\/CompanyMemoryService'\);/g, '');
content = content.replace(/const { COOService } = require\('\.\/COOService'\);/g, '');

fs.writeFileSync(file, content);
