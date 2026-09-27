const fs = require('fs');
const file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const injection = 
          {/* MANAGEMENT INTELLIGENCE (V3.6.1) */}
          {managementItems && managementItems.length > 0 && (
            <Card className="shadow-sm border-2 border-indigo-100 mb-6">
              <CardContent className="p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Management Focus
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['BUSINESS', 'OPERATIONS', 'TECHNOLOGY'].map(category => {
                    const items = managementItems.filter((i: any) => i.type === category);
                    if (items.length === 0) return null;
                    return (
                      <div key={category} className="space-y-3">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{category} HEALTH</div>
                        {items.map((item: any) => (
                          <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                               <div className="font-bold text-sm text-gray-900">{item.title}</div>
                               {item.priority === 'CRITICAL' && <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Critical</span>}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">{item.description}</div>
                            {item.evidence && item.evidence.occurrences && (
                               <div className="text-[11px] text-gray-500">{item.evidence.occurrences} occurrences</div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

;

content = content.replace('{/* AI CEO & WORKFORCE */}', injection + '          {/* AI CEO & WORKFORCE */}');
fs.writeFileSync(file, content);
console.log('Injected Management UI');
