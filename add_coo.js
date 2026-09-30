import fs from 'fs';
let file = 'backend/src/api/workspaces.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("insertAgent('AI COO'")) {
    content = content.replace(
        "const ctoId = await insertAgent('AI CTO'",
        "const cooId = await insertAgent('AI COO', 'Company operations and coordination', ['orchestrate_execution', 'manage_dependencies'], ceoId);\n    const ctoId = await insertAgent('AI CTO'"
    );
    fs.writeFileSync(file, content);
}
