import re

path = 'frontend/src/App.tsx'
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
  "import { Login } from '@/pages/Login';",
  "import { Login } from '@/pages/Login';\nimport { Landing } from '@/pages/Landing';\nimport { Pricing } from '@/pages/Pricing';"
)

c = re.sub(
    r'<Route path="/login" element=\{<Login />\} />\s*<Route path="/" element=\{<Navigate to="/dashboard" replace />\} />',
    """<Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />""",
    c
)

with open(path, 'w') as f:
    f.write(c)

print('patched App.tsx')
