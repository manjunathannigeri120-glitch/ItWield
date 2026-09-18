import { Action, ActionContext } from './Action';
import { getSecureConnection } from './integrationUtils';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

export class SlackSendMessageAction implements Action {
  id = 'slack_send_message';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { connectionId, channel, message } = config;

    if (!connectionId || !channel || !message) {
      throw new Error('INVALID_INTEGRATION_INPUT: Missing connectionId, channel, or message');
    }

    const credentials = await getSecureConnection(context, connectionId, 'slack');
    
    // Fallback gracefully for mock environment without failing tests
    if (credentials.mock) {
       return { sent: true, channel, mock: true };
    }

    const token = credentials.access_token || credentials.token;
    if (!token) {
        throw new Error('CONNECTION_UNAUTHORIZED: Missing Slack token');
    }

    // Call Slack API
    // Standard node native fetch is available in node 18+. Since we use node 18+, fetch is global.
    const response = await fetchWithTimeout('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            channel,
            text: message
        })
    });

    if (response.status === 429) {
        throw new Error('PROVIDER_RATE_LIMITED: Slack rate limit exceeded');
    }

    if (!response.ok) {
        throw new Error(`PROVIDER_UNAVAILABLE: Slack returned ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.ok) {
        throw new Error(`PROVIDER_UNAVAILABLE: Slack error - ${data.error}`);
    }

    return {
        sent: true,
        channel: data.channel || channel,
        timestamp: data.ts
    };
  }
}
