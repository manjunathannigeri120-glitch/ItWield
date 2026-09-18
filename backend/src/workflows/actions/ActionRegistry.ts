import { Action } from './Action';

export class ActionRegistry {
  private static actions = new Map<string, Action>();

  static register(action: Action) {
    this.actions.set(action.id, action);
  }

  static get(id: string): Action | undefined {
    return this.actions.get(id);
  }
}
