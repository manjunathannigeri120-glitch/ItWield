const fs = require('fs');
let file = 'backend/src/services/CEOService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const authResult = AuthorizationRegistry\.authorize\(actionId, aiPermissions\);\n\s*console\.warn\(`\[CEOService\] Action BLOCKED by registry: \$\{actionId\}\. Reason: \$\{authResult\.reason\}`\);\n\s*if \(authResult\.requiresApproval\) \{/g,
  `const authResult = AuthorizationRegistry.authorize(actionId, aiPermissions);
                   const reason = validation.reason || authResult.reason;
                   const requiresApp = validation.status === 'AUTHORIZATION_REQUIRED' || authResult.requiresApproval;
                   console.warn(\`[CEOService] Action BLOCKED by registry: \${actionId}. Reason: \${reason}\`);
                   if (requiresApp) {`
);

content = content.replace(
  /reason: authResult\.reason,/g,
  'reason: reason,'
);

fs.writeFileSync(file, content);
