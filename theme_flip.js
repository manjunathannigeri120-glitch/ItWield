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

// Map dark mode classes to AgentX style light mode classes
const classMap = {
    'bg-[#0b1121]': 'bg-[#F9F8F6]', // The agentx cream
    'bg-slate-900': 'bg-[#F9F8F6]',
    'text-white': 'text-[#111827]',
    'text-slate-400': 'text-[#4B5563]',
    'text-slate-300': 'text-[#374151]',
    'bg-slate-800/50': 'bg-white shadow-sm border border-slate-200',
    'bg-slate-800/30': 'bg-white/80 backdrop-blur shadow-sm border border-slate-200',
    'bg-slate-800': 'bg-white shadow-sm border border-slate-200',
    'border-slate-800': 'border-slate-200',
    'border-slate-700': 'border-slate-300',
    'text-emerald-400': 'text-emerald-700',
    'text-indigo-300': 'text-indigo-700',
    'bg-indigo-400/10': 'bg-indigo-50',
    'bg-white text-slate-900 hover:bg-slate-200': 'bg-[#3B3690] text-white hover:bg-[#2d296e]',
    'text-slate-900': 'text-[#111827]' // normalize just in case
};

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  for (const [dark, light] of Object.entries(classMap)) {
      // Use split/join for global replacement
      if (content.includes(dark)) {
          content = content.split(dark).join(light);
          changed = true;
      }
  }

  // Also replace some general text-white that might have been hardcoded
  if (content.includes('text-white')) {
      content = content.split('text-white').join('text-[#111827]');
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Converted theme in', f);
  }
});
