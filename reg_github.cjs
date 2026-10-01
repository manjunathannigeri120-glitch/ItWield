const fs = require('fs');
let file = 'backend/src/index.ts';
let content = fs.readFileSync(file, 'utf8');

// Insert import
content = content.replace(
  "import { SlackReadChannelAction } from './workflows/actions/SlackReadChannelAction';",
  "import { SlackReadChannelAction } from './workflows/actions/SlackReadChannelAction';\nimport { GitHubPullRequestAction } from './workflows/actions/GitHubPullRequestAction';"
);

// Insert registration
content = content.replace(
  "ActionRegistry.register(new GithubGetRepositoryActivityAction());",
  "ActionRegistry.register(new GithubGetRepositoryActivityAction());\nActionRegistry.register(new GitHubPullRequestAction());"
);

fs.writeFileSync(file, content);
console.log('Registered GitHubPullRequestAction');
