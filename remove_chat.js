const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// The block to remove starts from {/* 5. AI COMPANY COMMAND */}
// and goes down to just before {/* 6. HEALTH & ACTIVITY */}
const startMarker = "{/* 5. AI COMPANY COMMAND */}";
const endMarker = "{/* 6. HEALTH & ACTIVITY */}";
const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

// Now replace {/* 6. HEALTH & ACTIVITY */} <div className="space-y-8"> with nothing
content = content.replace(
  "{/* 6. HEALTH & ACTIVITY */}\n        <div className=\"space-y-8\">",
  "{/* 5 & 6. HEALTH & ACTIVITY */}"
);

// We need to remove the closing </div> of the space-y-8 wrapper.
// It is located right before the closing </div> of the grid.
const endOfGridMarker = "          </div>\n        </div>\n      </div>\n    </DashboardLayout>";
content = content.replace(
  "          </div>\n        </div>\n      </div>\n    </DashboardLayout>",
  "        </div>\n      </div>\n    </DashboardLayout>"
);

fs.writeFileSync(file, content);
