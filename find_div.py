import re

with open('frontend/src/pages/Dashboard.tsx', 'r') as f:
    lines = f.readlines()

nesting = 0
for i, line in enumerate(lines):
    opens = len(re.findall(r'<div\b', line))
    closes = len(re.findall(r'</div\b', line))
    nesting += opens - closes
    if nesting < 0:
        print(f"Nesting went negative at line {i+1}: {line.strip()}")
        break
