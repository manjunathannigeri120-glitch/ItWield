const fs = require('fs');
let file = 'backend/src/services/CompanyMemoryService.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "evidence: { ...evidence, expected_effect: evidence?.expected_effect, actual_result: evidence?.actual_result },",
  "evidence: evidence ? { ...evidence, expected_effect: evidence.expected_effect, actual_result: evidence.actual_result } : undefined,"
);

fs.writeFileSync(file, content);
console.log('Fixed memory evidence undefined');
