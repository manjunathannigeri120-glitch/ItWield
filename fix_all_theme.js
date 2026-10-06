const fs = require('fs');

const classMap = {
    'bg-[#0F172A]': 'bg-[#F9F8F6]', // The agentx cream
    'bg-[#0b1121]': 'bg-[#F9F8F6]',
    'bg-slate-900': 'bg-[#F9F8F6]',
    'bg-slate-950': 'bg-[#F9F8F6]',
    'text-white': 'text-[#111827]',
    'text-slate-50': 'text-[#111827]',
    'text-slate-300': 'text-[#4B5563]',
    'text-slate-400': 'text-[#4B5563]',
    'text-slate-500': 'text-[#6B7280]',
    'bg-slate-800/50': 'bg-white shadow-sm border border-slate-200',
    'bg-slate-800/30': 'bg-white shadow-sm border border-slate-200',
    'bg-slate-800': 'bg-white shadow-sm border border-slate-200',
    'border-slate-800': 'border-slate-200',
    'border-slate-700': 'border-slate-300',
    'bg-indigo-500': 'bg-[#3B3690]',
    'text-indigo-400': 'text-[#3B3690]',
    'text-emerald-400': 'text-emerald-700',
    'text-indigo-300': 'text-[#3B3690]',
    'bg-indigo-400/10': 'bg-indigo-50',
};

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

const files = walk('./frontend/src/components/landing').concat(['./frontend/src/pages/Landing.tsx']);

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  for (const [dark, light] of Object.entries(classMap)) {
      if (content.includes(dark)) {
          content = content.split(dark).join(light);
          changed = true;
      }
  }

  // Ensure button hover states are legible (white text on dark buttons)
  content = content.replace(/bg-\[#3B3690\] text-\[#111827\]/g, 'bg-[#3B3690] text-white');

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed theme in', f);
  }
});
