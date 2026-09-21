const fs = require('fs');
let content = fs.readFileSync('src/services/CEOService.ts', 'utf8');

content = content.replace(
  /const \\{ data: company, error: cErr \\} = await supabase\\s+\\.from\\('workspaces'\\)\\s+\\.select\\('\\*'\\)\\s+\\.eq\\('id', workspaceId\\)\\s+\\.single\\(\\);\\s+if \\(cErr \\|\\| !company\\) throw new Error\\('Company not found'\\);/,
  \const { data: company, error: cErr } = await supabase
      .from('workspaces')
      .update({ status: 'evaluating' })
      .eq('id', workspaceId)
      .neq('status', 'evaluating')
      .select('*')
      .single();
    if (cErr || !company) {
      console.log(\\\[CEOService] Workspace \\\ is locked or not found. Skipping.\\\);
      return { status: 'LOCKED_OR_NOT_FOUND' };
    }\
);

content = content.replace(
  /if \\(sourceWorkflowId && actualNextRunAt\\) \\{/,
  \wait supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);
    if (sourceWorkflowId && actualNextRunAt) {\
);

content = content.replace(
  /throw new Error\\(\\\AI CEO orchestration failed: \\\\\\\\);/,
  \wait supabase.from('workspaces').update({ status: 'operating' }).eq('id', workspaceId);
      throw new Error(\\\AI CEO orchestration failed: \\\\\\);\
);

fs.writeFileSync('src/services/CEOService.ts', content);
console.log('CEO lock patched');
