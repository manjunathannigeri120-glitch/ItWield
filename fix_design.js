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
const files = walk('./frontend/src');

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  const replaceText = (search, repl) => {
    if (content.includes(search)) {
      content = content.replace(search, repl);
      changed = true;
    }
  };

  // 5, 6
  replaceText('text-xs text-slate-500 uppercase tracking-wider font-bold mb-1', 'text-xs text-slate-400 font-bold mb-1');
  replaceText('text-xs font-bold uppercase tracking-widest text-slate-500', 'text-xs font-bold text-slate-400');

  // 7
  replaceText('text-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-10', 'text-center text-base font-bold text-slate-400 mb-10');
  
  // 8
  replaceText('text-sm font-bold text-white mb-6 uppercase tracking-widest', 'text-base font-bold text-white mb-6');

  // 9 Footer product
  replaceText('<h4 className="text-white font-bold mb-4">PRODUCT</h4>', '<h3 className="text-white font-bold mb-4">Product</h3>');

  // 10 Next button
  replaceText('text-indigo-400 font-bold flex items-center justify-center mx-auto hover:text-indigo-300 transition-colors', 'inline-flex items-center justify-center h-10 px-6 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-bold transition-colors mx-auto');

  // 11 Executive team - remove SVGs (rough approach: remove <svg class="absolute...)
  // We'll skip complex AST removal and focus on quick fixes, but let's replace "rounded-lg" on CTA buttons
  if (content.includes('Start Building Your AI Company') && content.includes('rounded-lg')) {
    content = content.replace(/rounded-lg/g, 'rounded-full');
    changed = true;
  }

  // 13 Pricing Table rows
  if (content.includes('Every plan, side by side.') && content.includes('<tr className="')) {
    content = content.replace(/<tr className="/g, '<tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ');
    changed = true;
  }

  // 14 Stepper inactive
  // Assuming active is bg-indigo-600 text-white. Inactive is text-slate-400.
  if (content.includes('bg-indigo-600 text-white') && content.includes('text-slate-400 hover:text-slate-300')) {
    content = content.replace(/text-slate-400 hover:text-slate-300/g, 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Updated', f);
  }
});
