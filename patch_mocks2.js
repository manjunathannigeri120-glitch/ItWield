const fs = require('fs');

const fixMock = (path) => {
  if (fs.existsSync(path)) {
    let c = fs.readFileSync(path, 'utf8');
    // Find the mock definition blocks and make sure they have 'in', 'single', 'maybeSingle'
    // Usually it looks like:  eq: vi.fn().mockReturnThis(),
    c = c.replace(/eq: vi\.fn\(\)\.mockReturnThis\(\),/g, "eq: vi.fn().mockReturnThis(),\n      in: vi.fn().mockReturnThis(),\n      single: vi.fn().mockResolvedValue({ data: null, error: null }),\n      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),");
    fs.writeFileSync(path, c);
  }
};

fixMock('backend/src/tests/ceoRouting.test.ts');
fixMock('backend/src/tests/ceoGoalAction.test.ts');
fixMock('backend/src/tests/commandCenter.test.ts');

console.log('patched test mocks');
