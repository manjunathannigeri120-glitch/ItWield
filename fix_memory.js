import fs from 'fs';
let file = 'frontend/src/pages/Memory.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix payload
content = content.replace(
  "await api.post('/workspaces/' + workspace.id + '/memory', {\n          title: addForm.memory_type + ' added manually',\n          content: addForm.content,\n          category: addForm.memory_type\n        });",
  "await api.post('/workspaces/' + workspace.id + '/memory', {\n          memory_type: addForm.memory_type,\n          content: addForm.content\n        });"
);

// Fix options
content = content.replace(
  /<option value="STRATEGIC_CONTEXT">Strategic Context<\/option>[\s\S]*?(?=<\/select>)/,
  '<option value="FACT">Fact</option>\n                      <option value="RULE">Rule</option>\n                      <option value="PREFERENCE">Preference</option>\n                      <option value="DECISION">Decision</option>\n                    '
);

fs.writeFileSync(file, content);
