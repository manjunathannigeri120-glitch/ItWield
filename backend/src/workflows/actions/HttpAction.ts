import { Action, ActionContext } from './Action';
import { HttpRequestTool } from '../../tools/httpRequest';

export class HttpAction implements Action {
  id = 'action_http';

  async execute(config: any, context: ActionContext): Promise<any> {
    // Preserve existing SSRF/Secure HTTP tool
    const httpTool = new HttpRequestTool();
    // In V0.3, HttpRequestTool execute uses args. It does not strictly depend on context,
    // but we can pass an empty object or partial context as we previously did.
    return await httpTool.execute(config, {} as any);
  }
}
