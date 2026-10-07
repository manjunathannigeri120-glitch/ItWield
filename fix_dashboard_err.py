import re

with open('frontend/src/pages/Dashboard.tsx', 'r', encoding='utf-8') as f:
    data = f.read()

data = data.replace(
    "setChatHistory(prev => [...prev, { role: 'ai', text: 'Connection error while contacting AI Company.' }]);",
    "setChatHistory(prev => [...prev, { role: 'ai', text: 'Connection error: ' + (err?.response?.data?.message || err?.response?.data?.error || err.message) }]);"
)

with open('frontend/src/pages/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(data)
