import re

path = 'frontend/src/pages/Dashboard.tsx'
with open(path, 'r') as f:
    c = f.read()

c = c.replace(
    'return (\n    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">',
    'return (\n    <>\n    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">'
)

c = c.replace(
    '      )}\\n\\n    </div>\\n  );\\n}',
    '      )}\n\n    </div>\n    </>\n  );\n}'
)

# more robust replace for the end
c = re.sub(r'      \)}\n\n    </div>\n  \);\n}', r'      )}\n\n    </div>\n    </>\n  );\n}', c)

with open(path, 'w') as f:
    f.write(c)
print('patched with fragment')
