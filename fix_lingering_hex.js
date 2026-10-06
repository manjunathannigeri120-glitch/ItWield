const fs = require('fs');

const classMap = {
    'bg-[#0B1121]': 'bg-[#F9F8F6]',
    'bg-[#0F172A]': 'bg-[#F9F8F6]',
    'bg-[#1E293B]': 'bg-white shadow-sm',
    'bg-[#020617]': 'bg-[#F9F8F6]',
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

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed lingering hex codes in', f);
  }
});
