const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Autonomy section
let old_autonomy = <p className="font-semibold text-slate-900">{ccData?.health?.operations === 'HEALTHY' ? 'Online' : 'Degraded'}</p>\n                    <p className="text-slate-500 text-xs">Heartbeat active</p>;
let new_autonomy = <p className="font-semibold text-slate-900">{ccData?.autonomy?.status || 'UNKNOWN'}</p>\n                    <p className="text-slate-500 text-xs">Last cycle: {ccData?.autonomy?.last_cycle ? new Date(ccData.autonomy.last_cycle).toLocaleTimeString() : 'N/A'}</p>;
content = content.replace(old_autonomy, new_autonomy);

fs.writeFileSync(file, content);
