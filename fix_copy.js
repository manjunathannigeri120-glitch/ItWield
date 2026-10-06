const fs = require('fs');
const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}
const files = walk('./frontend/src/components/landing');

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  const replaceText = (search, repl) => {
    if (content.includes(search)) {
      content = content.replace(search, repl);
      changed = true;
    }
  };

  const replaceRegex = (regex, repl) => {
    if (regex.test(content)) {
      content = content.replace(regex, repl);
      changed = true;
    }
  };

  // 1. CTA
  replaceText('Contact / Start Free', 'Start Free');

  // 2. Outcome -> Objective
  replaceText('Give your AI company an outcome.', 'Give your AI company an objective.');

  // 3. Pricing
  replaceText('For teams operating AI across more serious workloads.', 'For growing teams with high-volume automation needs.');

  // 4. Basic -> Standard (in tables)
  // Let's replace >Basic< with >Standard<
  replaceRegex(/>Basic</g, '>Standard<');

  // 5. Hero Subhead
  replaceText('keep your company moving.', 'ensure continuous business operation.');

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed copy in', f);
  }
});
