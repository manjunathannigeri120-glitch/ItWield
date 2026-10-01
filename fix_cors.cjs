const fs = require('fs');
let file = 'backend/src/index.ts';
let content = fs.readFileSync(file, 'utf8');

const newCors = `const rawOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];
  
  // Automatically support www. and non-www variants to prevent CORS errors
  const allowedOrigins = new Set(rawOrigins);
  for (const origin of rawOrigins) {
    if (origin.startsWith('https://itwield.com')) allowedOrigins.add('https://www.itwield.com');
    if (origin.startsWith('https://www.itwield.com')) allowedOrigins.add('https://itwield.com');
  }

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      
      // Do not throw a synchronous 500 error for bad CORS! Let it cleanly fail CORS.
      return callback(null, false);
    },`;

content = content.replace(
  /const allowedOrigins = process\.env\.ALLOWED_ORIGINS[\s\S]*?return callback\(new Error\(`CORS policy: origin \$\{origin\} not allowed`\)\);\s*\},/m,
  newCors
);

fs.writeFileSync(file, content);
console.log('Fixed CORS');
