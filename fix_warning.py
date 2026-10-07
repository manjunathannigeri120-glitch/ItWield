import re

with open('backend/src/index.ts', 'r', encoding='utf-8') as f:
    data = f.read()

data = data.replace(
    "if (!process.env.OPENAI_API_KEY) {",
    "if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {"
)

with open('backend/src/index.ts', 'w', encoding='utf-8') as f:
    f.write(data)
