const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
            {/* CTO OPERATIONS WIDGET */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" /> CTO Operations
                  </div>
                  <Link to="/cto" className="text-xs text-indigo-600 font-semibold hover:underline">Full Dashboard</Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Engine Status</p>
                      <p className="text-lg font-black text-slate-900 flex items-center gap-2">
                         <Shield className="w-4 h-4 text-indigo-500" /> {ccData?.health?.technology === 'HEALTHY' ? 'MONITORING (IDLE)' : 'ACTIVE (DIAGNOSING)'}
                      </p>
                   </div>
                   <Button variant="outline" size="sm" className="bg-white border-slate-200 shadow-sm text-indigo-700 hover:bg-indigo-50" onClick={async () => {
                        try {
                           await api.post(\`/cto/\${workspace.id}/diagnostic\`);
                           loadData();
                        } catch(e) { console.error(e); }
                   }}>
                      <PlayCircle className="w-4 h-4 mr-2 text-indigo-600" /> Run Manual Diagnostic
                   </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm h-[250px] flex flex-col">
`;

content = content.replace(
  '<Card className="border-slate-200 shadow-sm h-[250px] flex flex-col">',
  replacement
);

fs.writeFileSync(file, content);
console.log('Fixed Dashboard.tsx CTO Widget');
