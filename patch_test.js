const fs = require('fs');
let code = fs.readFileSync('backend/src/tests/scheduler429.test.ts', 'utf8');

const target = `  it('1. zero workspace observation cannot invoke CEO and is suspended', async () => {`;
const replacement = `  it('1. zero workspace observation cannot invoke CEO and is suspended', async () => {
    mockSupabase.limit.mockResolvedValueOnce({
      data: [
        { id: 'w1', workspace_id: '00000000-0000-0000-0000-000000000000', definition: { schedule: '0 * * * *' }, status: 'active' }
      ]
    });
    mockSupabase.single.mockResolvedValueOnce({ data: {} }); // For workflows update

    const res = await request(app).post('/api/v1/scheduler/tick').set('Authorization', 'Bearer dev-secret');
    expect(res.status).toBe(200);
    expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'suspended', next_run_at: null });
  });

  it('2. Missing workspace quarantines observation', async () => {
    mockSupabase.limit.mockResolvedValueOnce({
      data: [
        { id: 'w2', workspace_id: 'missing-ws', definition: { schedule: '0 * * * *' }, status: 'active' }
      ]
    });
    mockSupabase.single
      .mockResolvedValueOnce({ error: { code: 'PGRST116' } }) // Workspace lookup fails
      .mockResolvedValueOnce({ data: {} }); // workflows update

    const res = await request(app).post('/api/v1/scheduler/tick').set('Authorization', 'Bearer dev-secret');
    expect(res.status).toBe(200);
    expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'suspended', next_run_at: null });
  });

  it('x. ignored', async () => {`;

const target_crlf = target.replace(/\n/g, '\r\n');
if (code.includes(target)) {
    code = code.replace(target, replacement);
} else if (code.includes(target_crlf)) {
    code = code.replace(target_crlf, replacement.replace(/\n/g, '\r\n'));
} else {
    console.log("Missing workspace test target not found");
}

fs.writeFileSync('backend/src/tests/scheduler429.test.ts', code);
console.log("Missing workspace test patched");
