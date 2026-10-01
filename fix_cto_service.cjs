const fs = require('fs');
let file = 'backend/src/services/CTOService.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Remove evidence from insert
content = content.replace(
    /source: 'TASK_SYSTEM',\s*evidence: evidence/g,
    "source: 'TASK_SYSTEM'\n                // evidence field removed as it doesn't exist in schema cache"
);

// Fix 2: Remove confirmed_cause and suspected_cause from update
content = content.replace(
    /status: 'DIAGNOSED',\s*suspected_cause: suspected,\s*confirmed_cause: confirmed/g,
    "status: 'DIAGNOSED'\n        // suspected_cause, confirmed_cause removed"
);

// Fix 3: Remove resolution from update
content = content.replace(
    /resolution: 'INSUFFICIENT_DATA: No evidence provided to diagnose\.'/g,
    "// resolution removed"
);
content = content.replace(
    /resolution: `Verified independently\. Evidence: \$\{JSON\.stringify\(verificationEvidence\)\}`,/g,
    "// resolution removed"
);
content = content.replace(
    /resolution: `Task failed: \$\{task\.failure_reason \|\| task\.error\}\. Replanning needed\.`/g,
    "// resolution removed"
);
content = content.replace(
    /resolution: 'Verification failed or blocked\.'/g,
    "// resolution removed"
);

fs.writeFileSync(file, content);
