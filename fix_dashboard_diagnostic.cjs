const fs = require('fs');
let file = 'frontend/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the hardcoded diagnostic logic with a stateful one
content = content.replace(
  "const [operatingState, setOperatingState] = useState<string>('READY');",
  "const [operatingState, setOperatingState] = useState<string>('READY');\n    const [isDiagnosing, setIsDiagnosing] = useState(false);"
);

content = content.replace(
  "{ccData?.health?.technology === 'HEALTHY' ? 'MONITORING (IDLE)' : 'ACTIVE (DIAGNOSING)'}",
  "{isDiagnosing ? 'ACTIVE (DIAGNOSING)' : 'MONITORING (IDLE)'}"
);

content = content.replace(
  "await api.post(`/cto/${workspace.id}/diagnostic`);",
  "setIsDiagnosing(true); await api.post(`/cto/${workspace.id}/diagnostic`); setIsDiagnosing(false);"
);

fs.writeFileSync(file, content);
console.log('Fixed Diagnostic UI');
