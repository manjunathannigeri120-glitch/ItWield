import re

with open('backend/src/api/payments.ts', 'r', encoding='utf-8') as f:
    data = f.read()

data = data.replace("}) : null;", "});")

with open('backend/src/api/payments.ts', 'w', encoding='utf-8') as f:
    f.write(data)
