const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'tests', 'v511_multi_executive_coordination.test.ts');
let content = fs.readFileSync(file, 'utf8');

const replacement = `in: vi.fn((col, vals) => {
                        chain._filters.push((row: any) => vals.includes(row[col]));
                        return chain;
                    }),
                    not: vi.fn((col, val) => {
                        return chain; // mock
                    }),
                    neq: vi.fn((col, val) => {
                        chain._filters.push((row: any) => row[col] !== val);
                        return chain;
                    }),`;
content = content.replace(/in: vi\.fn\(\(col, vals\) => \{\n\s*chain\._filters\.push\(\(row: any\) => vals\.includes\(row\[col\]\)\);\n\s*return chain;\n\s*\}\),/g, replacement);

fs.writeFileSync(file, content);
