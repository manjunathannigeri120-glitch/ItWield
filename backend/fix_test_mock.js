const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'tests', 'v511_multi_executive_coordination.test.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /is: vi\.fn\(\(col, val\) => {/g,
    `not: vi.fn((col, val) => {
                        chain._filters.push((row: any) => row[col] !== val);
                        return chain;
                    }),
                    neq: vi.fn((col, val) => {
                        chain._filters.push((row: any) => row[col] !== val);
                        return chain;
                    }),
                    is: vi.fn((col, val) => {`
);

fs.writeFileSync(file, content);
