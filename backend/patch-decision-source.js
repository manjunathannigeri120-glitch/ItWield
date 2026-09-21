const fs = require('fs');
let content = fs.readFileSync('src/services/CEOService.ts', 'utf8');

content = content.replace(/let ceoDecision: any;\\s+try \\{/, 'let ceoDecision: any;\\n    let decisionSource = \\'LIVE_LLM\\';\\n    try {');

content = content.replace(/ceoDecision = \\{\\s+assessment: "Development mock assessment."/, 'decisionSource = \\'DETERMINISTIC_FALLBACK\\';\\n        ceoDecision = {\\n          assessment: "Development mock assessment."');

content = content.replace(/details: \\{ source: 'CEO', title: createdTask\\.title \\}/, 'details: { source: \\'CEO\\', decision_source: decisionSource, title: createdTask.title }');

fs.writeFileSync('src/services/CEOService.ts', content);
console.log('Decision source patched');
