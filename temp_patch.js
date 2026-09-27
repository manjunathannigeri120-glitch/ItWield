const fs = require('fs');

let code = fs.readFileSync('backend/src/services/CEOService.ts', 'utf8');

// Replace competitive analysis block start
code = code.replace(
  "          if (taskType === 'COMPETITIVE_ANALYSIS') {",
  "          } else if (taskType === 'COMPETITIVE_ANALYSIS') {"
);

// Replace lead research block start
code = code.replace(
  "          if (taskType === 'LEAD_RESEARCH') {",
  "          } else if (taskType === 'LEAD_RESEARCH') {"
);

// Add the else block after LEAD_RESEARCH
const targetStr = `                  task_type: 'LEAD_RESEARCH',
                  delegate_to: executor ? executor.id : assignee.id
                }
              });
            }
          }`;

const replacementStr = `                  task_type: 'LEAD_RESEARCH',
                  delegate_to: executor ? executor.id : assignee.id
                }
              });
            }
          } else {
            const assignee = agents && agents.length > 0 ? agents[0] : null;
            if (assignee) {
              generatedTasks.push({
                title: taskType.replace(/_/g, ' '),
                description: \`Execute mission step: \${taskType} for \${company.name}\`,
                agent_id: assignee.id,
                priority: 'high',
                workflow_id: null,
                input: {
                  task_type: taskType,
                  delegate_to: assignee.id
                }
              });
            }
          }`;

code = code.replace(targetStr, replacementStr);

fs.writeFileSync('backend/src/services/CEOService.ts', code);
console.log('Patch complete.');
