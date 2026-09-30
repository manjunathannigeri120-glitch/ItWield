const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'services', 'CEOService.ts');
let content = fs.readFileSync(file, 'utf8');

// replace requires with standard imports if not already imported at top
if (!content.includes('import { CompanyCoordinationService }')) {
    content = "import { CompanyCoordinationService } from './CompanyCoordinationService';\n" + content;
}
content = content.replace(/const { CompanyCoordinationService } = require\('\.\/CompanyCoordinationService'\);/g, '');

fs.writeFileSync(file, content);
