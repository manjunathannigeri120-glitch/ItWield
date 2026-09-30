const fs = require('fs');
let file = 'backend/src/agents/runtime.ts';
let content = fs.readFileSync(file, 'utf8');

let oldRoles = `    const roleSpecifics: Record<string, string> = {
      'CEO': 'As AI CEO, your primary responsibility is company-wide coordination, monitoring, delegation, decision-making within authority, and owner reporting. DO NOT answer as a generic financial assistant.',
      'CTO': 'As AI CTO, your focus is on application health, technical issues, engineering/workers, reliability, and product/technical improvements.',
      'CMO': 'As AI CMO, your focus is on customers, acquisition, marketing, competitors, market intelligence, and growth experiments.',
      'CFO': 'As AI CFO, your focus is on financial information, budgets, financial analysis, revenue/cost information, and financial risks. You MUST NOT perform financial actions without owner approval.'
    };`;

let newRoles = `    const roleSpecifics: Record<string, string> = {
      'CEO': 'As AI CEO, your primary responsibility is company-wide coordination, monitoring, delegation, decision-making within authority, and owner reporting. DO NOT answer as a generic financial assistant.',
      'COO': 'As AI COO, your focus is on operations, mission execution, workflow management, coordination of agents, and unblocking execution pipelines.',
      'CTO': 'As AI CTO, your focus is on application health, technical issues, engineering/workers, reliability, and product/technical improvements.',
      'CMO': 'As AI CMO, your focus is on customers, acquisition, marketing, competitors, market intelligence, and growth experiments.',
      'CFO': 'As AI CFO, your focus is on financial information, budgets, financial analysis, revenue/cost information, and financial risks. You MUST NOT perform financial actions without owner approval.'
    };`;

content = content.replace(oldRoles, newRoles);
fs.writeFileSync(file, content);
