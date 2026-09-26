export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  owningAction?: string; // The action that this capability permits
  requiredConnection?: string;
}

export class CapabilityRegistry {
  private static capabilities: Record<string, CapabilityDefinition> = {
    'APPLICATION_MONITORING': { id: 'APPLICATION_MONITORING', name: 'Application Monitoring', description: 'Monitor system health', owningAction: 'APPLICATION_MONITORING' },
    'COMPETITIVE_ANALYSIS': { id: 'COMPETITIVE_ANALYSIS', name: 'Competitive Analysis', description: 'Analyze competitive landscape', owningAction: 'COMPETITIVE_ANALYSIS' },
    'COMPETITOR_RESEARCH': { id: 'COMPETITOR_RESEARCH', name: 'Competitor Research', description: 'Research competitor data', owningAction: 'COMPETITOR_RESEARCH' },
    'DATA_TRANSFORMATION': { id: 'DATA_TRANSFORMATION', name: 'Data Transformation', description: 'Transform arbitrary data formats', owningAction: 'DATA_TRANSFORMATION' },
    'GENERATE_BUSINESS_REPORT': { id: 'GENERATE_BUSINESS_REPORT', name: 'Generate Business Report', description: 'Generate business insights reports', owningAction: 'GENERATE_BUSINESS_REPORT' },
    'LEAD_RESEARCH': { id: 'LEAD_RESEARCH', name: 'Lead Research', description: 'Research potential leads', owningAction: 'LEAD_RESEARCH' },
    'OUTREACH_DRAFTING': { id: 'OUTREACH_DRAFTING', name: 'Outreach Drafting', description: 'Draft outreach messages', owningAction: 'OUTREACH_DRAFTING' },
    'AWAIT_OUTREACH_APPROVALS': { id: 'AWAIT_OUTREACH_APPROVALS', name: 'Await Outreach Approvals', description: 'Wait for outreach approvals', owningAction: 'AWAIT_OUTREACH_APPROVALS' },
    'STORE_BUSINESS_DATA': { id: 'STORE_BUSINESS_DATA', name: 'Store Business Data', description: 'Store structured business data', owningAction: 'STORE_BUSINESS_DATA' },
    'WEB_RESEARCH': { id: 'WEB_RESEARCH', name: 'Web Research', description: 'Research topics on the web', owningAction: 'WEB_RESEARCH' },
    'SEND_EMAIL': { id: 'SEND_EMAIL', name: 'Send Email', description: 'Send an email', owningAction: 'SEND_EMAIL' },
    
    // GitHub
    'GITHUB_LIST_REPOSITORIES': { id: 'GITHUB_LIST_REPOSITORIES', name: 'GitHub List Repositories', description: 'List GitHub repos', requiredConnection: 'github', owningAction: 'GITHUB_LIST_REPOSITORIES' },
    'GITHUB_LIST_ISSUES': { id: 'GITHUB_LIST_ISSUES', name: 'GitHub List Issues', description: 'List GitHub issues', requiredConnection: 'github', owningAction: 'GITHUB_LIST_ISSUES' },
    'GITHUB_LIST_PULL_REQUESTS': { id: 'GITHUB_LIST_PULL_REQUESTS', name: 'GitHub List PRs', description: 'List GitHub PRs', requiredConnection: 'github', owningAction: 'GITHUB_LIST_PULL_REQUESTS' },
    'GITHUB_GET_REPOSITORY_ACTIVITY': { id: 'GITHUB_GET_REPOSITORY_ACTIVITY', name: 'GitHub Get Repository Activity', description: 'Get GitHub repo activity', requiredConnection: 'github', owningAction: 'GITHUB_GET_REPOSITORY_ACTIVITY' },
    'GITHUB_GET_ISSUE': { id: 'GITHUB_GET_ISSUE', name: 'GitHub Get Issue', description: 'Get GitHub issue', requiredConnection: 'github', owningAction: 'GITHUB_GET_ISSUE' },
    'GITHUB_GET_PULL_REQUEST': { id: 'GITHUB_GET_PULL_REQUEST', name: 'GitHub Get PR', description: 'Get GitHub PR', requiredConnection: 'github', owningAction: 'GITHUB_GET_PULL_REQUEST' },

    // Slack
    'SLACK_LIST_CHANNELS': { id: 'SLACK_LIST_CHANNELS', name: 'Slack List Channels', description: 'List Slack channels', requiredConnection: 'slack', owningAction: 'SLACK_LIST_CHANNELS' },
    'SLACK_READ_CHANNEL': { id: 'SLACK_READ_CHANNEL', name: 'Slack Read Channel', description: 'Read Slack channel', requiredConnection: 'slack', owningAction: 'SLACK_READ_CHANNEL' },
    'SLACK_SEARCH_MESSAGES': { id: 'SLACK_SEARCH_MESSAGES', name: 'Slack Search Messages', description: 'Search Slack messages', requiredConnection: 'slack', owningAction: 'SLACK_SEARCH_MESSAGES' },
    'SLACK_GET_RECENT_ACTIVITY': { id: 'SLACK_GET_RECENT_ACTIVITY', name: 'Slack Get Recent Activity', description: 'Get Slack activity', requiredConnection: 'slack', owningAction: 'SLACK_GET_RECENT_ACTIVITY' },

    // Google Sheets
    'GOOGLE_SHEETS_LIST': { id: 'GOOGLE_SHEETS_LIST', name: 'Google Sheets List', description: 'List Google Sheets', requiredConnection: 'google_sheets', owningAction: 'GOOGLE_SHEETS_LIST' },
    'GOOGLE_SHEETS_READ': { id: 'GOOGLE_SHEETS_READ', name: 'Google Sheets Read', description: 'Read Google Sheets', requiredConnection: 'google_sheets', owningAction: 'GOOGLE_SHEETS_READ' },
  };

  /**
   * Normalizes a capability string deterministically.
   * "Competitive Analysis" -> "COMPETITIVE_ANALYSIS"
   * "competitive_analysis" -> "COMPETITIVE_ANALYSIS"
   * " COMPETITOR_RESEARCH " -> "COMPETITOR_RESEARCH"
   */
  static normalize(raw: string): string {
    if (!raw) return '';
    let normalized = raw.trim().toUpperCase();
    normalized = normalized.replace(/\s+/g, '_');
    normalized = normalized.replace(/-+/g, '_');
    
    // Exact mapping check (e.g. if we had historical aliases)
    const exactAliases: Record<string, string> = {
      'COMPETITOR_ANALYSIS': 'COMPETITIVE_ANALYSIS' // handle common misconfigurations safely
    };
    if (exactAliases[normalized]) {
        normalized = exactAliases[normalized];
    }
    
    return normalized;
  }

  static get(id: string): CapabilityDefinition | undefined {
    return this.capabilities[this.normalize(id)];
  }

  static getAll(): CapabilityDefinition[] {
    return Object.values(this.capabilities);
  }

  static getRequiredCapabilityForAction(actionId: string): string | undefined {
    // Actions are typically 1:1 mapped with capability IDs for now
    const cap = this.get(actionId);
    return cap?.id;
  }
}
