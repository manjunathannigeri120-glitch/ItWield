import re

with open('frontend/src/pages/GoalDetail.tsx', 'r', encoding='utf-8') as f:
    data = f.read()

# Add import
if "import { LiveTerminal }" not in data:
    data = data.replace(
        "import { Button } from '../components/ui/button';",
        "import { Button } from '../components/ui/button';\nimport { LiveTerminal } from '../components/LiveTerminal';"
    )

# Add component at bottom
if "<LiveTerminal" not in data:
    data = data.replace(
        "</CardContent>\n      </Card>\n\n    </div>",
        "</CardContent>\n      </Card>\n\n      <LiveTerminal workspaceId={localStorage.getItem('itwield_workspace_id') || ''} />\n    </div>"
    )

with open('frontend/src/pages/GoalDetail.tsx', 'w', encoding='utf-8') as f:
    f.write(data)
