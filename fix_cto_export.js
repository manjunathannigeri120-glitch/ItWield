import fs from 'fs';
let file = 'frontend/src/pages/CTO.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "export function CTO() {",
  "export default function CTO() {"
);

fs.writeFileSync(file, content);
