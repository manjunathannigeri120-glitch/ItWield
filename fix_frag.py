import re

with open('frontend/src/pages/Dashboard.tsx', 'r') as f:
    c = f.read()

c = re.sub(r'(\s*)\);\n}', r'\1  </>\n  );\n}', c)
with open('frontend/src/pages/Dashboard.tsx', 'w') as f:
    f.write(c)

print('fixed fragment tail')
