const fs = require('fs');
let file = 'backend/src/services/AuthorizationRegistry.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "'GITHUB_ISSUES_CREATE': { id: 'GITHUB_ISSUES_CREATE', name: 'GitHub Create Issue', owningExecutive: 'AI CTO', riskLevel: 'medium', isAutonomous: false, requiresOwnerApproval: true, readOnly: false, modifiesExternal: true, requiredConnection: 'github' },",
  "'GITHUB_ISSUES_CREATE': { id: 'GITHUB_ISSUES_CREATE', name: 'GitHub Create Issue', owningExecutive: 'AI CTO', riskLevel: 'medium', isAutonomous: false, requiresOwnerApproval: true, readOnly: false, modifiesExternal: true, requiredConnection: 'github' },\n    'GITHUB_CREATE_PULL_REQUEST': { id: 'GITHUB_CREATE_PULL_REQUEST', name: 'GitHub Create PR', owningExecutive: 'AI CTO', riskLevel: 'medium', isAutonomous: false, requiresOwnerApproval: true, readOnly: false, modifiesExternal: true, requiredConnection: 'github' },\n    'GITHUB_COMMIT_TO_MAIN': { id: 'GITHUB_COMMIT_TO_MAIN', name: 'GitHub Commit to Main', owningExecutive: 'AI CTO', riskLevel: 'critical', isAutonomous: false, requiresOwnerApproval: true, readOnly: false, modifiesExternal: true, requiredConnection: 'github' },"
);

fs.writeFileSync(file, content);
console.log('Added GitHub actions to AuthRegistry');
