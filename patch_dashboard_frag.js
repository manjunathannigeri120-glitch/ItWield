const fs = require('fs');
let path = 'frontend/src/pages/Dashboard.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "return (\\n    <div className=\\"p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen\\">",
  "return (\\n    <>\\n    <div className=\\"p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen\\">"
);

c = c.replace(
  "      )}\\n\\n    </div>\\n  );\\n}",
  "      )}\\n\\n    </div>\\n    </>\\n  );\\n}"
);

fs.writeFileSync(path, c);
console.log('wrapped in fragment');
