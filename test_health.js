const http = require('https');
http.get('https://itwield.vercel.app/api/health', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, data));
}).on('error', (err) => console.log('Error:', err.message));
