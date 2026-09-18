import { Action, ActionContext } from './Action';

export class ConditionAction implements Action {
  id = 'control_condition';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { left, operator, right } = config;
    let isTrue = false;
    
    switch (operator) {
      case '==': isTrue = left == right; break;
      case '!=': isTrue = left != right; break;
      case '>': isTrue = left > right; break;
      case '<': isTrue = left < right; break;
    }
    
    return { evaluated_true: isTrue };
  }
}
