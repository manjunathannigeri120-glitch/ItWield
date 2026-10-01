const fs = require('fs');
let file = 'backend/src/index.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { GitHubPullRequestAction } from './workflows/actions/GitHubPullRequestAction';",
  "import { GitHubPullRequestAction } from './workflows/actions/GitHubPullRequestAction';\nimport { GithubReadFileAction } from './workflows/actions/GithubReadFileAction';"
);

content = content.replace(
  "ActionRegistry.register(new GitHubPullRequestAction());",
  "ActionRegistry.register(new GitHubPullRequestAction());\nActionRegistry.register(new GithubReadFileAction());"
);

fs.writeFileSync(file, content);
console.log('Registered GithubReadFileAction');
