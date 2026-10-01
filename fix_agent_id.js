const fs = require('fs');
let file = 'backend/src/api/agents.ts';
let content = fs.readFileSync(file, 'utf8');

let fixIdCode = `
      let dbAgentId = agentId;
      if (['ceo', 'cto', 'cmo', 'coo', 'cfo'].includes(agentId)) {
        // Find by role if fallback string was passed
        if (req.supabase) {
           const { data: roleAgents } = await req.supabase.from('agents').select('*').ilike('role', agentId).limit(1);
           if (roleAgents && roleAgents.length > 0) {
             dbAgentId = roleAgents[0].id;
           } else {
             const { data: nameAgents } = await req.supabase.from('agents').select('*').ilike('name', '%' + agentId + '%').limit(1);
             if (nameAgents && nameAgents.length > 0) dbAgentId = nameAgents[0].id;
             else {
               // Just pick the first agent available
               const { data: anyAgents } = await req.supabase.from('agents').select('*').limit(1);
               if (anyAgents && anyAgents.length > 0) dbAgentId = anyAgents[0].id;
             }
           }
        }
      }
      
      let agent;
      if (!req.supabase) {
        agent = mockAgents.find(a => a.id === dbAgentId);
        if (!agent) throw new Error('Agent not found or access denied');
      } else {
        // Fetch agent config
        const { data: dbAgent, error: agentError } = await req.supabase
          .from('agents')
          .select('*')
          .eq('id', dbAgentId)
          .single();
`;

content = content.replace(
  /let agent;\s+if \(!req\.supabase\) {[\s\S]*?\.single\(\);/m,
  fixIdCode
);

fs.writeFileSync(file, content);
