const fs = require('fs');
let code = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');

const target = `    let shouldUnlock = true;
    try {
      const { data: company } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();`;

const replacement = `    let shouldUnlock = true;
    try {
      // 429 Provider Cooldown Check
      const { data: recentRateLimits } = await supabase.from('workspace_events')
        .select('created_at')
        .eq('workspace_id', workspaceId)
        .eq('event_type', 'PROVIDER_RATE_LIMIT')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (recentRateLimits && recentRateLimits.length > 0) {
        const lastLimit = new Date(recentRateLimits[0].created_at);
        if (Date.now() - lastLimit.getTime() < 15 * 60 * 1000) { // 15 min cooldown
          console.log(\`[CEOService] Workspace \${workspaceId} in provider cooldown. Skipping observation.\`);
          return;
        }
      }

      const { data: company } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();`;

const target_crlf = target.replace(/\n/g, '\r\n');
if (code.includes(target)) {
    code = code.replace(target, replacement);
} else if (code.includes(target_crlf)) {
    code = code.replace(target_crlf, replacement.replace(/\n/g, '\r\n'));
} else {
    console.log("Cooldown target not found");
}

fs.writeFileSync('backend/src/services/CEOService.ts', code);
console.log("Cooldown patched");
