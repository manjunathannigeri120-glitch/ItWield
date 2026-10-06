const fs = require('fs');
let file = 'frontend/src/layouts/DashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');
if (!content.includes('<UpgradeModal />')) {
    content = content.replace('      {children}\n      </main>\n    </div>', '      {children}\n      </main>\n      <UpgradeModal />\n    </div>');
    fs.writeFileSync(file, content);
}
