export interface ActionDefinition {
  id: string;
  name: string;
  owningExecutive: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isAutonomous: boolean;
  requiresOwnerApproval: boolean;
  readOnly: boolean;
  modifiesExternal: boolean;
  requiredPermission?: string;
  requiredConnection?: string;
}

export class AuthorizationRegistry {
  private static actions: Record<string, ActionDefinition> = {
    // Safe Actions
    'APPLICATION_MONITORING': {
      id: 'APPLICATION_MONITORING',
      name: 'Application Health Monitoring',
      owningExecutive: 'AI CTO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
    },
    'COMPETITIVE_ANALYSIS': {
      id: 'COMPETITIVE_ANALYSIS',
      name: 'Competitive Analysis',
      owningExecutive: 'AI CMO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
      requiredPermission: 'competitive_analysis_enabled'
    },
    'IMPROVEMENT_PROPOSAL': {
      id: 'IMPROVEMENT_PROPOSAL',
      name: 'Improvement Proposal',
      owningExecutive: 'AI CEO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
    },
    'WORKFLOW_EXECUTION': {
      id: 'WORKFLOW_EXECUTION',
      name: 'Workflow Execution',
      owningExecutive: 'AI CEO',
      riskLevel: 'medium',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: false,
      modifiesExternal: true,
    },

    'WEB_RESEARCH': {
      id: 'WEB_RESEARCH',
      name: 'Web Research',
      owningExecutive: 'AI CMO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
      requiredConnection: 'web_search',
    },
    'COMPETITOR_RESEARCH': {
      id: 'COMPETITOR_RESEARCH',
      name: 'Competitor Research',
      owningExecutive: 'AI CMO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
      requiredConnection: 'web_search',
    },
    'LEAD_RESEARCH': {
      id: 'LEAD_RESEARCH',
      name: 'Lead Research',
      owningExecutive: 'AI CMO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
      requiredConnection: 'web_search',
    },
    'DATA_TRANSFORMATION': {
      id: 'DATA_TRANSFORMATION',
      name: 'Data Transformation',
      owningExecutive: 'AI CTO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
    },
    'STORE_BUSINESS_DATA': {
      id: 'STORE_BUSINESS_DATA',
      name: 'Store Business Data',
      owningExecutive: 'AI CTO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: false,
      modifiesExternal: false,
    },
    'GENERATE_BUSINESS_REPORT': {
      id: 'GENERATE_BUSINESS_REPORT',
      name: 'Generate Business Report',
      owningExecutive: 'AI CEO',
      riskLevel: 'low',
      isAutonomous: true,
      requiresOwnerApproval: false,
      readOnly: true,
      modifiesExternal: false,
    },

    // High-Risk Actions (Approval Required)
    'PRODUCTION_DEPLOYMENT': {
      id: 'PRODUCTION_DEPLOYMENT',
      name: 'Production Deployment',
      owningExecutive: 'AI CTO',
      riskLevel: 'critical',
      isAutonomous: false,
      requiresOwnerApproval: true,
      readOnly: false,
      modifiesExternal: true,
    },
    'MAJOR_PRODUCT_CHANGE': {
      id: 'MAJOR_PRODUCT_CHANGE',
      name: 'Major Product Change',
      owningExecutive: 'AI CTO',
      riskLevel: 'high',
      isAutonomous: false,
      requiresOwnerApproval: true,
      readOnly: false,
      modifiesExternal: true,
    },
    'FINANCIAL_ACTION': {
      id: 'FINANCIAL_ACTION',
      name: 'Financial Action',
      owningExecutive: 'AI CFO',
      riskLevel: 'critical',
      isAutonomous: false,
      requiresOwnerApproval: true,
      readOnly: false,
      modifiesExternal: true,
    },
    'EXTERNAL_COMMUNICATION': {
      id: 'EXTERNAL_COMMUNICATION',
      name: 'External Communication',
      owningExecutive: 'AI CMO',
      riskLevel: 'high',
      isAutonomous: false,
      requiresOwnerApproval: true,
      readOnly: false,
      modifiesExternal: true,
    },

    // Permanently Blocked Pricing Actions
    'CHANGE_PRICING': { id: 'CHANGE_PRICING', name: 'Change Pricing', owningExecutive: 'AI CFO', riskLevel: 'critical', isAutonomous: false, requiresOwnerApproval: true, readOnly: false, modifiesExternal: true },
    'CHANGE_SUBSCRIPTION_PRICE': { id: 'CHANGE_SUBSCRIPTION_PRICE', name: 'Change Subscription Price', owningExecutive: 'AI CFO', riskLevel: 'critical', isAutonomous: false, requiresOwnerApproval: true, readOnly: false, modifiesExternal: true },
    'CHANGE_DISCOUNT': { id: 'CHANGE_DISCOUNT', name: 'Change Discount', owningExecutive: 'AI CFO', riskLevel: 'critical', isAutonomous: false, requiresOwnerApproval: true, readOnly: false, modifiesExternal: true },
    'CHANGE_BILLING_AMOUNT': { id: 'CHANGE_BILLING_AMOUNT', name: 'Change Billing Amount', owningExecutive: 'AI CFO', riskLevel: 'critical', isAutonomous: false, requiresOwnerApproval: true, readOnly: false, modifiesExternal: true },
    'CHANGE_CREDITS': { id: 'CHANGE_CREDITS', name: 'Change Credits', owningExecutive: 'AI CFO', riskLevel: 'critical', isAutonomous: false, requiresOwnerApproval: true, readOnly: false, modifiesExternal: true },
    'CHANGE_PAYMENT_TERMS': { id: 'CHANGE_PAYMENT_TERMS', name: 'Change Payment Terms', owningExecutive: 'AI CFO', riskLevel: 'critical', isAutonomous: false, requiresOwnerApproval: true, readOnly: false, modifiesExternal: true },
  };

  private static PERMANENTLY_BLOCKED = [
    'CHANGE_PRICING', 'CHANGE_SUBSCRIPTION_PRICE', 'CHANGE_DISCOUNT', 
    'CHANGE_BILLING_AMOUNT', 'CHANGE_CREDITS', 'CHANGE_PAYMENT_TERMS',
    'DELETE_DATABASE', 'SEND_MONEY'
  ];

  static authorize(actionId: string, permissions: Record<string, boolean> = {}): { authorized: boolean; reason: string; requiresApproval: boolean; definition?: ActionDefinition } {
    if (!actionId) {
      return { authorized: false, reason: 'No action specified.', requiresApproval: false };
    }

    if (this.PERMANENTLY_BLOCKED.includes(actionId)) {
      return { authorized: false, reason: 'Action is permanently blocked by system policy.', requiresApproval: false };
    }

    const definition = this.actions[actionId];
    if (!definition) {
      return { authorized: false, reason: `Unknown action: ${actionId}. It is not registered in the trusted AuthorizationRegistry.`, requiresApproval: false };
    }

    if (definition.requiredPermission && permissions[definition.requiredPermission] === false) {
      return { authorized: false, reason: `Company permission '${definition.requiredPermission}' is disabled.`, requiresApproval: false, definition };
    }

    if (!definition.isAutonomous || definition.requiresOwnerApproval) {
      return { authorized: false, reason: `Action '${definition.name}' requires owner approval.`, requiresApproval: true, definition };
    }

    return { authorized: true, reason: `Authorized automatically because ${definition.name} is enabled and classified as ${definition.riskLevel}-risk work.`, requiresApproval: false, definition };
  }
}
