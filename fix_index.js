const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const importStatement = "import { OutreachDraftingAction } from './workflows/actions/OutreachDraftingAction';\nActionRegistry.register(new OutreachDraftingAction());\n";

if (!code.includes('OutreachDraftingAction')) {
  code = code.replace("ActionRegistry.register(new TransformDataAction());", "ActionRegistry.register(new TransformDataAction());\n" + importStatement);
  fs.writeFileSync('backend/src/index.ts', code);
}
