export interface PlanEntitlements {
  max_workers: number;
  max_missions: number; // -1 for unlimited
  max_connections: number; // -1 for unlimited
  features: string[];
}

export interface PlanDefinition {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_interval: 'month' | 'year';
  currency: string;
  entitlements: PlanEntitlements;
}

export class PlanCatalog {
  private static plans: Record<string, PlanDefinition> = {
    'SOLO_BUILDER': {
      id: 'SOLO_BUILDER',
      name: 'Solo Builder',
      description: 'Perfect for founders ready to automate.',
      price: 299,
      billing_interval: 'month',
      currency: 'USD',
      entitlements: {
        max_workers: 25,
        max_missions: -1,
        max_connections: -1,
        features: ['advanced_workforce', 'advanced_missions', 'command_center']
      }
    },
    'ENTERPRISE': {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      description: 'Custom AI workforce for large organizations.',
      price: 999,
      billing_interval: 'month',
      currency: 'USD',
      entitlements: {
        max_workers: -1,
        max_missions: -1,
        max_connections: -1,
        features: ['advanced_workforce', 'advanced_missions', 'command_center', 'sso', 'custom_models']
      }
    }
  };

  static getPlan(planId: string): PlanDefinition {
    return this.plans[planId] || this.plans['SOLO_BUILDER'];
  }

  static getAllPlans(): PlanDefinition[] {
    return Object.values(this.plans);
  }
}
