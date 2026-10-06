const fs = require('fs');
let dash = fs.readFileSync('frontend/src/pages/Dashboard.tsx', 'utf8');
dash = dash.replace('onSubmit={handleChat}', 'onSubmit={sendChatMessage}');
fs.writeFileSync('frontend/src/pages/Dashboard.tsx', dash);
