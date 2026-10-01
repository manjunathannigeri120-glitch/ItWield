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

  const replaceAll = (search, repl) => {
    if (content.includes(search)) {
      content = content.split(search).join(repl);
      changed = true;
    }
  };

  const replaceRegex = (regex, repl) => {
    if (regex.test(content)) {
      content = content.replace(regex, repl);
      changed = true;
    }
  };

  // 1 & 2: aria-label for icon buttons
  replaceRegex(/<button\s+className="p-2 text-slate-400 hover:text-indigo-400 transition-colors">/g, '<button aria-label="Toggle Menu" className="p-2 text-slate-400 hover:text-indigo-400 transition-colors">');
  
  // Contrast fixes: text-slate-500 -> text-slate-400
  replaceRegex(/text-slate-500/g, 'text-slate-400');
  
  // Contrast fixes: text-slate-600 -> text-slate-400
  replaceRegex(/text-slate-600/g, 'text-slate-400');

  // Contrast fixes: #424f64 -> slate-400
  replaceRegex(/text-\[\#424f64\]/g, 'text-slate-400');

  // Contrast fixes: text-indigo-400 -> text-indigo-300
  // Note: Only inside elements where contrast is low, but doing it globally on landing page is safer for dark mode.
  // Actually let's just target the specific ones:
  replaceRegex(/text-indigo-400 bg-indigo-400\/10/g, 'text-indigo-300 bg-indigo-400/10');
  replaceRegex(/text-indigo-400 font-bold uppercase/g, 'text-indigo-300 font-bold uppercase');

  // Contrast fixes: text-emerald-500/70 and /50 -> text-emerald-400
  replaceRegex(/text-emerald-500\/70/g, 'text-emerald-400');
  replaceRegex(/text-emerald-500\/50/g, 'text-emerald-400');
  replaceRegex(/text-emerald-500/g, 'text-emerald-400'); // blanket fix for emerald on dark

  // bg-indigo-500 -> bg-indigo-600 for contrast with white text
  replaceRegex(/bg-indigo-500 text-white/g, 'bg-indigo-600 text-white');
  replaceRegex(/bg-indigo-500/g, 'bg-indigo-600');

  // Arrow aria-hidden
  replaceRegex(/>?<\/span>/g, ' aria-hidden="true">?</span>');

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed A11y in', f);
  }
});
