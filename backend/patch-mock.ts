const fs = require('fs');
let content = fs.readFileSync('src/services/CEOService.ts', 'utf8');

content = content.replace(/ceoDecision = \{\s*assessment: 'Mock evaluation[^}]+\};\s*\}\s*\} catch/,
  \ceoDecision = {
          assessment: 'Mock evaluation. Assuming healthy for test.',
          conclusion: 'HEALTHY',
          follow_up_tasks: [],
          owner_update: 'Task evaluated. Result looks fine.'
        };
      }
    } catch\);

content = content.replace(/ceoDecision = \{\s*assessment: "Development mock assessment.",\s*priority: "medium",\s*decision: "delegate",\s*tasks: \[\],\s*owner_update: "API key missing, generated mock assessment."\s*\};/,
  \ceoDecision = {
          assessment: "Development mock assessment.",
          priority: "medium",
          decision: "delegate",
          tasks: [
            {
              title: "Check application health",
              description: "Run the configured application health check and report the result.",
              agent_id: agents && agents.length > 0 ? agents[0].id : null,
              workflow_id: workflows && workflows.length > 0 ? workflows[0].id : null,
              priority: "high"
            }
          ],
          owner_update: "API key missing, generated mock assessment to run health check."
        };\);

fs.writeFileSync('src/services/CEOService.ts', content);
console.log('Mock patched!');
