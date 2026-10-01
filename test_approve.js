const axios = require('axios');
async function test() {
    try {
        const res = await axios.post('https://itwield.vercel.app/api/v1/workspaces/6b154cfb-d1ed-4880-ad44-2162c59167cd/approvals/123/approve');
        console.log(res.data);
    } catch (e) {
        console.log(e.response ? e.response.data : e.message);
    }
}
test();
