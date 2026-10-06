const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/GoalDetail.tsx', 'utf8');
file = file.replace(
  /Verify Now[\s\S]*?<\/Button>/,
  `Verify Now\n          </Button>\n          <Button variant="destructive" onClick={async () => {\n            if (!confirm('Are you sure you want to delete this goal?')) return;\n            try {\n              const wsId = localStorage.getItem('itwield_workspace_id');\n              await api.delete(\`/workspaces/\${wsId}/goals/\${goalId}\`);\n              window.location.href = '/dashboard';\n            } catch(e: any) {\n              alert('Failed to delete goal: ' + (e?.response?.data?.error || e?.message));\n            }\n          }}>\n            Delete Goal\n          </Button>`
);
fs.writeFileSync('frontend/src/pages/GoalDetail.tsx', file);
