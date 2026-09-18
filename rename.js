const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all tracked files that might contain the strings
const files = execSync('git ls-files').toString().trim().split('\n');

const replacements = [
  { search: /Dovia/g, replace: 'ItWield' },
  { search: /dovia/g, replace: 'itwield' }
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
