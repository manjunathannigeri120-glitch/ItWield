const fs = require('fs');
let file = 'frontend/src/pages/Onboarding.tsx';
let content = fs.readFileSync(file, 'utf8');

const newCatch = `} catch (e: any) {
      if (e.message === 'Network Error') {
        setError('Unable to connect to the server. Please try again in a moment.');
      } else if (e.response?.status >= 500) {
        setError('Our servers are currently starting up or undergoing maintenance. Please wait 1-2 minutes and try again.');
      } else if (e.response?.status === 404) {
        setError('The setup service is temporarily unreachable. Please refresh your page to ensure you have the latest version.');
      } else {
        setError(e.response?.data?.error || 'Failed to complete setup. Please try again.');
      }
      setLoading(false);
    }`;

content = content.replace(
  /} catch \(e: any\) \{\s*setError\(e\.response\?\.data\?\.error \|\| 'Failed to complete setup'\);\s*setLoading\(false\);\s*\}/,
  newCatch
);

fs.writeFileSync(file, content);
console.log('Improved error handling');
