const fs = require('fs');

let content = fs.readFileSync('src/workflows/scheduler.ts', 'utf8');

// Add CEOService import
content = content.replace(
  /import \{ WorkflowEngine \} from '\.\/engine';/,
  \import { WorkflowEngine } from './engine';\\nimport { CEOService } from '../services/CEOService';\
);

// Replace the execution block
content = content.replace(
  /\/\/ Create a workflow run[\\s\\S]*?WorkflowEngine\.run\([\\s\\S]*?catch\(err => console\.error\(\\\\[Scheduler\] Workflow execution failed for \$\{workflow\.id\}:\\\, err\)\);/,
  \// Create an initial task for the scheduled observation
        console.log('Invoking CEO for scheduled observation:', workflow.name);
        
        CEOService.run(
          supabase,
          workflow.workspace_id,
          \\\A scheduled observation "\\\" (ID: \\\) has triggered. Delegate a task to execute this workflow so we can observe the results.\\\,
          'service_role'
        ).catch(err => console.error(\\\[Scheduler] CEO invocation failed for \\\:\\\, err));\
);

fs.writeFileSync('src/workflows/scheduler.ts', content);
console.log('Scheduler patched');
