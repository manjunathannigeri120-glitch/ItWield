const fs = require('fs');

const fixMock = (path) => {
  if (fs.existsSync(path)) {
    let c = fs.readFileSync(path, 'utf8');
    c = c.replace(/eq: vi\.fn\(\)\.mockReturnThis\(\),/g, "eq: vi.fn().mockReturnThis(),\n      in: vi.fn().mockReturnThis(),\n      single: vi.fn().mockResolvedValue({ data: null, error: null }),");
    fs.writeFileSync(path, c);
  }
};

fixMock('backend/src/tests/billing.test.ts');
fixMock('backend/src/tests/ceoRouting.test.ts');
fixMock('backend/src/tests/ceoGoalAction.test.ts');
fixMock('backend/src/tests/commandCenter.test.ts');

console.log('patched test mocks');
