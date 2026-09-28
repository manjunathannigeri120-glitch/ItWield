const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/CompanyControl.tsx', 'utf8');

code = code.replace(
  "import { Shield, Pause, Play, Square, Activity, History, CheckCircle } from 'lucide-react';",
  "import { Shield, Pause, Play, Square, Activity, History, CheckCircle, Database, GitBranch, Key, Check, X } from 'lucide-react';"
);

const originalSection = \        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 flex items-center mb-4">
            <Shield className="w-5 h-5 mr-2 text-indigo-500" /> Connected Systems
          </h3>
          <div className="text-2xl font-bold text-slate-800">{systems.length}</div>
          <p className="text-sm text-slate-500 mt-2">Total external integrations.</p>
        </div>
      </div>\;

const newSection = originalSection + \

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700 flex items-center">
            <GitBranch className="w-5 h-5 mr-2 text-slate-400" /> Connected Company Systems
          </h3>
          <Button variant="outline" size="sm">Connect New System</Button>
        </div>
        <div className="divide-y divide-slate-100">
          {systems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No systems connected yet.</div>
          ) : (
            systems.map((sys) => (
              <div key={sys.id} className="p-6 flex flex-col sm:flex-row justify-between hover:bg-slate-50">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900 text-lg">{sys.display_name}</span>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">{sys.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{sys.system_type}</p>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Available Capabilities:</p>
                    <div className="flex flex-wrap gap-2">
                      {sys.capabilities?.map((cap: string) => (
                        <span key={cap} className="text-xs bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-600 flex items-center">
                          <Check className="w-3 h-3 mr-1 text-green-500" /> {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-col space-y-2 items-end justify-start">
                  <Button variant="outline" size="sm" onClick={async () => {
                    const res = await api.post('/workspaces/' + currentWorkspace?.id + '/connections/' + sys.id + '/test', {});
                    if(res.status) { alert('Test Complete: ' + res.status); loadData(); }
                  }}>Test Connection</Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">Disconnect</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>\;

code = code.replace(originalSection, newSection);

// Update class name string interpolation correctly
code = code.replace(/<span className=\{\\\\\	ext-xs font-bold px-2 py-1 rounded-full \\\\\\\}\}>/g, '<span className={\	ext-xs font-bold px-2 py-1 rounded-full \\}>');
code = code.replace(/<span className=\{\\\\\	ext-xs font-bold px-2 py-1 rounded-full \\\\\\\}\}>/g, '<span className={\	ext-xs font-bold px-2 py-1 rounded-full \\}>');

fs.writeFileSync('frontend/src/pages/CompanyControl.tsx', code);
