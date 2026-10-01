const fs = require('fs');
let file = 'backend/src/api/index.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('./payments')) {
    content = content.replace("import authRoutes from './auth';", "import authRoutes from './auth';\nimport paymentRoutes from './payments';");
    content = content.replace("router.use('/auth', authRoutes);", "router.use('/auth', authRoutes);\nrouter.use('/payments', paymentRoutes);");
    fs.writeFileSync(file, content);
    console.log('Mounted payments route');
}
