const fs = require('fs');

let content = fs.readFileSync('src/api/scheduler.ts', 'utf8');

const pendingLogic = \
    // 3. Recover stuck PENDING tasks (crash recovery for retries & follow-ups)
    const { data: stuckWorkspaces } = await supabase
      .from('tasks')
      .select('workspace_id')
      .eq('status', 'PENDING')
      .limit(10);

    if (stuckWorkspaces && stuckWorkspaces.length > 0) {
      // Get unique workspaces
      const uniqueWids = [...new Set(stuckWorkspaces.map((t: any) => t.workspace_id))];
      for (const wid of uniqueWids) {
        console.log(\\\[Scheduler] Recovering pending tasks for workspace \\\\\\);
        CEOService.run(supabase, wid as string, 'Execute pending tasks').catch(console.error);
        triggeredCount++;
      }
    }
\;

content = content.replace(/return res\\.json\\(\\{ triggered: triggeredCount \\}\\);/, pendingLogic + '\\n    return res.json({ triggered: triggeredCount });');

fs.writeFileSync('src/api/scheduler.ts', content);
console.log('Scheduler pending logic added');
