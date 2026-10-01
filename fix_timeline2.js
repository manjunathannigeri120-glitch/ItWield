const fs = require('fs');
let file = 'backend/src/api/commandCenter.ts';
let content = fs.readFileSync(file, 'utf8');

// Filter duplicates in decisionTimeline
let fixTimelineDedup = `decisionTimeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const uniqueTimeline = [];
      const seenSignatures = new Set();
      for (const item of decisionTimeline) {
        const sig = item.action + '|' + item.outcome;
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          uniqueTimeline.push(item);
        }
      }
      
      const finalTimeline = uniqueTimeline.slice(0, 30);`;

content = content.replace(/decisionTimeline\.sort\(\(a,\s*b\)\s*=>\s*new\s*Date\(b\.timestamp\)\.getTime\(\)\s*-\s*new\s*Date\(a\.timestamp\)\.getTime\(\)\)\.slice\(0,\s*30\);/, fixTimelineDedup);

content = content.replace(/decisionTimeline,/g, 'decisionTimeline: finalTimeline,');

fs.writeFileSync(file, content);
