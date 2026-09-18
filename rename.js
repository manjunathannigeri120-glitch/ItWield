const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all tracked files that might contain the strings
const files = execSync('git ls-files').toString().trim().split('\n');

const replacements = [
  { search: /AgentX/g, replace: 'Dovia' },
  { search: /agentx/g, replace: 'dovia' },
  { search: /AI Workforce/g, replace: 'Dovia' },
  { search: /ai agent/g, replace: 'Dovia' },
  { search: /<title>frontend<\/title>/g, replace: '<title>Dovia</title>' }
];

for (const file of files) {
  // Skip binary/non-text or irrelevant files
  if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.html') && !file.endsWith('.sql') && !file.endsWith('.md')) {
    continue;
  }
  
  const filePath = path.join(__dirname, file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const { search, replace } of replacements) {
      if (search.test(content)) {
        content = content.replace(search, replace);
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  } catch (err) {
    console.error(`Skipping ${file}: ${err.message}`);
  }
}
