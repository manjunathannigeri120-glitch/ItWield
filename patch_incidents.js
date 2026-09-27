const fs = require('fs');

let ceo = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');

// Replace the insert
const targetInsert = `        await supabase.from('workspace_events').insert({
          workspace_id: workspaceId,
          event_type: 'PROVIDER_RATE_LIMIT',
          details: { error: e.message, provider: 'openrouter' }
        });`;

const replaceInsert = `        await supabase.from('incidents').insert({
          workspace_id: workspaceId,
          type: 'PROVIDER_RATE_LIMIT',
          severity: 'high',
          status: 'DETECTED',
          title: 'Provider Rate Limit Exceeded',
          description: errMsg,
          source: 'scheduler'
        });`;

// Replace the select
const targetSelect = `      // 429 Provider Cooldown Check
      const { data: recentRateLimits } = await supabase.from('workspace_events')
        .select('created_at')
        .eq('workspace_id', workspaceId)
        .eq('event_type', 'PROVIDER_RATE_LIMIT')
        .order('created_at', { ascending: false })
        .limit(1);`;

const replaceSelect = `      // 429 Provider Cooldown Check
      const { data: recentRateLimits } = await supabase.from('incidents')
        .select('created_at')
        .eq('workspace_id', workspaceId)
        .eq('type', 'PROVIDER_RATE_LIMIT')
        .order('created_at', { ascending: false })
        .limit(1);`;


let replacedInsert = false;
let replacedSelect = false;

if (ceo.includes(targetInsert)) { ceo = ceo.replace(targetInsert, replaceInsert); replacedInsert = true; }
else { 
    const t = targetInsert.replace(/\n/g, '\r\n');
    if (ceo.includes(t)) { ceo = ceo.replace(t, replaceInsert.replace(/\n/g, '\r\n')); replacedInsert = true; }
}

if (ceo.includes(targetSelect)) { ceo = ceo.replace(targetSelect, replaceSelect); replacedSelect = true; }
else { 
    const t = targetSelect.replace(/\n/g, '\r\n');
    if (ceo.includes(t)) { ceo = ceo.replace(t, replaceSelect.replace(/\n/g, '\r\n')); replacedSelect = true; }
}

fs.writeFileSync('backend/src/services/CEOService.ts', ceo);
console.log('Insert patched:', replacedInsert);
console.log('Select patched:', replacedSelect);
