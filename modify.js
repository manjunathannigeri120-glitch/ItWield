const fs = require('fs');
const content = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');
const search = '{/* AI CEO & WORKFORCE (TOP TIER) */}';
const parts = content.split(search);

if (parts.length === 2) {
  const replacement = `      {/* V3.5 AI MANAGEMENT */}
      {data?.managementItems && data.managementItems.length > 0 && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-md overflow-hidden">
          <div className="bg-blue-50/50 border-b border-blue-100 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-800">AI Management Focus</h2>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
              {data.managementItems.length} Active Item(s)
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.managementItems.slice(0, 2).map((item: any) => (
              <div key={item.id} className="border border-slate-200 rounded-lg p-5 bg-slate-50 relative">
                {item.priority === 'CRITICAL' && <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{item.type}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{item.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Why It Matters:</span>
                    <span className="font-medium text-slate-800">{item.priority_reason || 'Impacts goals'}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Assigned Executive:</span>
                    <span className="font-bold text-indigo-600">AI {item.assigned_executive_id || 'CEO'}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-medium text-slate-800">{item.status}</span>
                  </div>
                  {item.ceo_decisions && item.ceo_decisions.length > 0 && (
                    <div className="bg-white p-3 rounded border border-slate-200 mt-2">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Current Decision</div>
                      <div className="text-sm text-slate-800">{item.ceo_decisions[0].decision}</div>
                      {item.ceo_decisions[0].status === 'APPROVAL_REQUIRED' && (
                        <div className="mt-2 inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Owner Approval Required
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI CEO & WORKFORCE (TOP TIER) */}
`;
  fs.writeFileSync('frontend/src/pages/Dashboard.tsx', parts[0] + replacement + parts[1]);
  console.log('Successfully inserted AI Management into Dashboard.tsx');
} else {
  console.log('Search string not found.');
}
`;
