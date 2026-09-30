const fs = require('fs');
let file = 'backend/src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the executives array construction
let oldExec = `    const executives = [
      {
        role: 'CEO',
        name: aiCeo?.name || 'AI CEO',
        focus: ceoDecisions[0]?.assessment || 'Monitoring operations',
        blockers: pendingApprovals.length > 0 ? \`\${pendingApprovals.length} approvals pending\` : 'None',
        latestDecision: ceoDecisions[0]?.decision || 'None'
      },
      {
        role: 'CTO',
        name: aiCto?.name || 'AI CTO',
        focus: techHealth !== 'HEALTHY' ? 'Resolving technology incidents' : 'Maintaining system reliability',
        blockers: techHealth === 'DEGRADED' ? 'Provider availability issues' : 'None',
        latestDecision: 'System optimization'
      },
      {
        role: 'CMO',
        name: aiCmo?.name || 'AI CMO',
        focus: 'Customer Acquisition and Growth',
        blockers: 'None',
        latestDecision: opportunities.length > 0 ? 'Evaluating market responses' : 'Prospecting'
      }
    ];`;

let newExec = `    const aiCoo = getExec('AI COO') || getExec('COO');
    const aiCfo = getExec('AI CFO') || getExec('CFO');
    const executives = [
      {
        role: 'CEO',
        id: aiCeo?.id || null,
        status: aiCeo?.status || 'READY',
        name: aiCeo?.name || 'AI CEO',
        focus: ceoDecisions[0]?.assessment || 'Monitoring operations',
        blockers: pendingApprovals.length > 0 ? \`\${pendingApprovals.length} approvals pending\` : 'None',
        latestDecision: ceoDecisions[0]?.decision || 'None'
      },
      {
        role: 'COO',
        id: aiCoo?.id || null,
        status: aiCoo?.status || 'READY',
        name: aiCoo?.name || 'AI COO',
        focus: 'Operations, execution & coordination',
        blockers: 'None',
        latestDecision: 'None'
      },
      {
        role: 'CMO',
        id: aiCmo?.id || null,
        status: aiCmo?.status || 'READY',
        name: aiCmo?.name || 'AI CMO',
        focus: 'Customers, acquisition & growth',
        blockers: 'None',
        latestDecision: opportunities.length > 0 ? 'Evaluating market responses' : 'Prospecting'
      },
      {
        role: 'CTO',
        id: aiCto?.id || null,
        status: aiCto?.status || 'READY',
        name: aiCto?.name || 'AI CTO',
        focus: techHealth !== 'HEALTHY' ? 'Resolving technology incidents' : 'Maintaining system reliability',
        blockers: techHealth === 'DEGRADED' ? 'Provider availability issues' : 'None',
        latestDecision: 'System optimization'
      },
      {
        role: 'CFO',
        id: aiCfo?.id || null,
        status: aiCfo?.status || 'READY',
        name: aiCfo?.name || 'AI CFO',
        focus: 'Financial health, costs & economics',
        blockers: 'None',
        latestDecision: 'Monitoring burn rate'
      }
    ];`;

content = content.replace(oldExec, newExec);
fs.writeFileSync(file, content);
