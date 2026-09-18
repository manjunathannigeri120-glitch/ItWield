import { Action, ActionContext } from './Action';
import { getSecureConnection } from './integrationUtils';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

export class DiscordSendMessageAction implements Action {
  id = 'discord_send_message';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { connectionId, channelId, message } = config; // channelId is often required for bot tokens, or webhook URL

    if (!connectionId || (!channelId && !config.webhookUrl) || !message) {
      throw new Error('INVALID_INTEGRATION_INPUT: Missing connectionId, channelId/webhookUrl, or message');
    }

    const credentials = await getSecureConnection(context, connectionId, 'discord');
    
    if (credentials.mock) {
       return { sent: true, mock: true };
    }

    // Usually discord integrations use Webhooks for simple notifications
    const webhookUrl = credentials.webhook_url || config.webhookUrl;
    
    if (webhookUrl) {
        const response = await fetchWithTimeout(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
        
        if (response.status === 429) {
            throw new Error('PROVIDER_RATE_LIMITED: Discord rate limit exceeded');
        }

        if (!response.ok) {
            throw new Error(`PROVIDER_UNAVAILABLE: Discord returned ${response.statusText}`);
        }
        
        return { sent: true, type: 'webhook' };
    }

    // Fallback to bot token
    const token = credentials.bot_token || credentials.token;
    if (!token || !channelId) {
        throw new Error('CONNECTION_UNAUTHORIZED: Missing Discord token or channelId');
    }

    const response = await fetchWithTimeout(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bot ${token}`
        },
        body: JSON.stringify({
            content: message
        })
    });

    if (response.status === 429) {
        throw new Error('PROVIDER_RATE_LIMITED: Discord rate limit exceeded');
    }

    if (!response.ok) {
        throw new Error(`PROVIDER_UNAVAILABLE: Discord returned ${response.statusText}`);
    }

    const data = await response.json();
    return {
        sent: true,
        channel: channelId,
        messageId: data.id
    };
  }
}
