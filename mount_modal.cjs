const fs = require('fs');
let file = 'frontend/src/layouts/DashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { UpgradeModal }')) {
    content = "import { UpgradeModal } from '@/components/UpgradeModal';\n" + content;
    // Inject just before the closing </div> of the layout
    content = content.replace('      </div>\n    </div>\n  );\n}', '      </div>\n      <UpgradeModal />\n    </div>\n  );\n}');
    fs.writeFileSync(file, content);
    console.log('Mounted UpgradeModal');
}
