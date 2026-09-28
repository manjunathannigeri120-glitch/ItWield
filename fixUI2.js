const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/CompanyControl.tsx', 'utf8');

// The issue is on line 137.
code = code.replace(/api\.post\(\(\/workspaces\/\) \+ currentWorkspace\?\.id \+ \(\/connections\/\) \+ sys\.id \+ \(\/test\), \{\}\)/, 'api.post(\"/workspaces/\" + currentWorkspace?.id + \"/connections/\" + sys.id + \"/test\", {})');
code = code.replace(/alert\( Test Complete: ' \+ res\.status\)/, 'alert(\"Test Complete: \" + res.status)');

fs.writeFileSync('frontend/src/pages/CompanyControl.tsx', code);
