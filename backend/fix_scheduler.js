const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'api', 'scheduler.ts');
let content = fs.readFileSync(file, 'utf8');

const targetLoop = `// 7. Continuous CTO Loop
    if (activeWorkspaces) {
      for (const w of activeWorkspaces) {
        console.log(\`[Scheduler] Triggering CTOService for workspace \${w.id}\`);
        CTOService.operate(supabase, w.id).catch(console.error);
        triggeredCount++;
      }
    }`;

const v512Heartbeat = `
    // V5.12 Durable Autonomous Heartbeat & Lease Recovery
    if (activeWorkspaces) {
      for (const w of activeWorkspaces) {
        try {
          const { data: ws } = await supabase.from('workspaces')
            .select('operating_state, ceo_locked_until, coo_locked_until, cmo_locked_until, cto_locked_until, cfo_locked_until')
            .eq('id', w.id)
            .single();

          if (!ws || ws.operating_state === 'PAUSED' || ws.operating_state === 'STOPPED') continue;

          // Lease Expiry Recovery
          const now = Date.now();
          const executives = ['ceo', 'coo', 'cmo', 'cto', 'cfo'];
          const updates: any = {};
          let recovered = false;

          for (const exec of executives) {
            const lockCol = \`\${exec}_locked_until\`;
            if (ws[lockCol] && new Date(ws[lockCol]).getTime() < now) {
              updates[lockCol] = null;
              recovered = true;
              console.log(\`[Scheduler] Recovered stale \${exec.toUpperCase()} lease for workspace \${w.id}\`);
            }
          }
          if (recovered) {
            await supabase.from('workspaces').update(updates).eq('id', w.id);
          }

          // Trigger V5.11 Multi-Executive Coordination Pipeline
          console.log(\`[Scheduler] V5.12 Heartbeat triggering CEO for workspace \${w.id}\`);
          const { CEOService } = require('../services/CEOService');
          CEOService.operate(supabase, w.id).catch(console.error);
          triggeredCount++;

        } catch (e: any) {
           console.error('[Scheduler] V5.12 Heartbeat error:', e);
        }
      }
    }
`;

content = content.replace(targetLoop, v512Heartbeat);
fs.writeFileSync(file, content);
