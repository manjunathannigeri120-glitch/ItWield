const fs = require('fs');
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix userId logic
content = content.replace(/const userId = req\.user\?\.id \|\| 'service_role';/g, "const userId = (req.user?.id && req.user.id !== 'mock-user-id' && req.user.id !== 'service_role') ? req.user.id : null;");

// In updateData for approve and reject, only include resolved_by if it's a valid UUID
content = content.replace(/resolved_by: userId/g, "resolved_by: userId || undefined");

fs.writeFileSync(file, content);
