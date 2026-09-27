const fs = require('fs');
let code = fs.readFileSync('backend/src/services/MissionPlanningService.ts', 'utf8');

const replacement = `{ title: 'Deduplicate prospects', description: 'Remove duplicate prospects', step_type: 'DATA_TRANSFORMATION', worker_role: 'service_role', authorization_class: 'DATA_TRANSFORMATION' },
                { title: 'Prioritize qualified prospects', description: 'Rank prospects', step_type: 'DATA_TRANSFORMATION', worker_role: 'service_role', authorization_class: 'DATA_TRANSFORMATION' },
                { title: 'Draft Outreach', description: 'Draft personalized outreach email', step_type: 'OUTREACH_DRAFTING', worker_role: 'service_role', authorization_class: 'OUTREACH_DRAFTING' },
                { title: 'Await Approval / Execute Approved Outreach', description: 'Wait for owner to approve drafted emails and execute them', step_type: 'AWAIT_OUTREACH_APPROVALS', worker_role: 'service_role', authorization_class: 'DATA_TRANSFORMATION' }
            ];
            objective = 'Standard execution plan for acquiring customers through research, qualification, and automated outreach.';`;

code = code.replace(/\{ title: 'Deduplicate prospects'[\s\S]*?objective = 'Standard execution plan for acquiring customers through research and qualification\.';/, replacement);
fs.writeFileSync('backend/src/services/MissionPlanningService.ts', code);
