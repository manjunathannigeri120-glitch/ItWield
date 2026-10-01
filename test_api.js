const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'backend/.env' });

const token = jwt.sign({ id: '2818b020-0ae5-4be9-966e-906ec3bf0852', role: 'authenticated' }, process.env.SUPABASE_ANON_KEY || 'mock', { noTimestamp: true });

axios.post('http://localhost:3000/api/v1/workspaces/07135e67-5e4c-49e6-99e5-89d2b31da6e2/approvals/241412a0-dc3d-41a9-aaf9-e1d1ccb248a1/approve', {}, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => console.log(r.status, r.data)).catch(e => console.log(e.response?.status, e.response?.data));
