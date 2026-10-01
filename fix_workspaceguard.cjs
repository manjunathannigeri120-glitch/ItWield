const fs = require('fs');
let file = 'frontend/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const newCatch = `.catch((err) => {
          console.error('WorkspaceGuard fetch error:', err);
          if (err.message === 'Network Error' || (err.response && err.response.status >= 500)) {
            setStatus('error');
          } else {
            // Only fallback to onboarding if it's a 4xx error (e.g. 404) or similar
            setStatus('pending');
          }
          setLoading(false);
        });`;

content = content.replace(
  /\.catch\(\(err\) => \{\s*console\.error\('WorkspaceGuard fetch error:', err\);\s*setLoading\(false\);\s*setStatus\('pending'\); \/\/ Fallback to pending to trigger onboarding\s*\}\);/,
  newCatch
);

// Also need to handle status === 'error' in WorkspaceGuard
const errorRender = `if (status === 'error') {
      return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-50 text-slate-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Connecting to Server</h2>
          <p className="max-w-md text-center">
            Our systems are currently waking up or experiencing high load. Please wait a moment.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry Connection
          </button>
        </div>
      );
    }`;

content = content.replace(
  /if \(loading\) return <div className="flex h-screen items-center justify-center">Loading workspace\.\.\.<\/div>;/,
  `if (loading) return <div className="flex h-screen items-center justify-center">Loading workspace...</div>;\n    ${errorRender}`
);

fs.writeFileSync(file, content);
console.log('Fixed WorkspaceGuard');
