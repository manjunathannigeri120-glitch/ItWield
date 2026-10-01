const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = "{/* 5. AI COMPANY COMMAND */}";
const endMarker = "{/* 6. HEALTH & ACTIVITY */}";
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

// Remove the `space-y-8` div wrapper around Health & Activity, and its closing div
content = content.replace(
  "{/* 6. HEALTH & ACTIVITY */}\n          <div className=\"space-y-8\">\n",
  "{/* 5 & 6. HEALTH & ACTIVITY */}\n"
);

content = content.replace(
  "            </Card>\n          </div>\n        </div>\n  \n      </div>\n    </DashboardLayout>",
  "            </Card>\n        </div>\n  \n      </div>\n    </DashboardLayout>"
);

fs.writeFileSync(file, content);
