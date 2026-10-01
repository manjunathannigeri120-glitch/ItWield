const fs = require('fs');
let file = 'backend/src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');

// Modify the decisionTimeline mapping for tasks
let fixTasksMapping = `tasks.slice(0, 15).forEach((t: any) => decisionTimeline.push({
          id: t.id,
          timestamp: t.updated_at || t.created_at,
          actor: t.assigned_agent || 'WORKFORCE',
          role: 'Worker',
          action: (t.status === 'COMPLETED' ? 'Completed Task: ' : (t.status === 'BLOCKED' ? 'Blocked Task: ' : 'Scheduled Task: ')) + (t.title || 'Action'),
          reason: t.description || 'System routine',
          outcome: t.status === 'BLOCKED' && t.error ? 'BLOCKED - ' + t.error : t.status
      }));`;

content = content.replace(/tasks\.slice\(0,\s*15\)\.forEach\(\(t:\s*any\)\s*=>\s*decisionTimeline\.push\(\{[\s\S]*?\}\)\);/, fixTasksMapping);

fs.writeFileSync(file, content);
