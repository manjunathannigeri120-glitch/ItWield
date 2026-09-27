const fs = require('fs');
const file = 'frontend/src/pages/Dashboard.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  "      companySteering,\n      \n      \n      approvals",
  "      companySteering,\n      workforce,\n      approvals"
);

const workforceHtml = `          {/* WORKFORCE READINESS */}
          <Card className="shadow-sm border-gray-200 mt-6">
            <CardContent className="p-5">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Workforce Readiness
              </h2>
              <div className="space-y-3">
                {workforce.map((w: any) => (
                  <div key={w.id} className={\`p-3 border rounded bg-white flex justify-between items-start \${w.state === 'MISCONFIGURED' ? 'border-red-200 bg-red-50' : ''}\`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-900">{w.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{w.role || 'Worker'}</span>
                        <span className={\`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded \${w.state === 'READY' ? 'bg-green-100 text-green-700' : w.state === 'MISCONFIGURED' ? 'bg-red-100 text-red-700' : w.state === 'BLOCKED' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}\`}>
                          {w.state}
                        </span>
                      </div>
                      {w.reason && w.state !== 'READY' && w.state !== 'WORKING' && <div className="text-xs text-red-600 font-medium mt-1">{w.reason}</div>}
                      {w.capabilities?.invalid?.length > 0 && (
                        <div className="text-[11px] text-red-600 mt-1"><span className="font-semibold">Invalid Capabilities:</span> {w.capabilities.invalid.join(', ')}</div>
                      )}
                      {w.capabilities?.missingConns?.length > 0 && (
                        <div className="text-[11px] text-amber-600 mt-1"><span className="font-semibold">Missing Connections:</span> {w.capabilities.missingConns.join(', ')}</div>
                      )}
                      {w.currentTask && <div className="text-xs text-blue-600 font-medium mt-1">Working: {w.currentTask}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
`;

c = c.replace(
  /\{\/\* RIGHT COLUMN \*\/\}/,
  `${workforceHtml}\n        </div>\n\n        {/* RIGHT COLUMN */}`
);

fs.writeFileSync(file, c);
console.log('patched Dashboard.tsx');
