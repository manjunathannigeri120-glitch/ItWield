const fs = require('fs');
let file = 'frontend/src/layouts/DashboardLayout.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('      </main>\r\n    </div>', '      </main>\r\n      <UpgradeModal />\r\n    </div>');
content = content.replace('      </main>\n    </div>', '      </main>\n      <UpgradeModal />\n    </div>');
fs.writeFileSync(file, content);
