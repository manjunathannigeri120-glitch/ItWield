import { Action, ActionContext } from './Action';
import axios from 'axios';

export class SendEmailAction implements Action {
  id = 'action_send_email';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { to, subject, text, html, cc, bcc, replyTo } = config;
    if (!to || !subject) throw new Error('Missing required email fields (to, subject)');
    if (!text && !html) throw new Error('Missing required email fields (text or html must be provided)');

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[SendEmailAction] RESEND_API_KEY not set. Mocking email send.');
      return { success: true, sent: true, mock: true, recipientCount: 1 };
    }

    try {
      const payload: any = {
        from: process.env.RESEND_FROM_EMAIL || 'Acme <onboarding@resend.dev>',
        to,
        subject,
        text,
        html,
        cc,
        bcc,
        reply_to: replyTo
      };

      // Strip empty fields
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const response = await axios.post('https://api.resend.com/emails', payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        sent: true,
        messageId: response.data?.id,
        recipientCount: (typeof to === 'string' ? to.split(',').length : (to?.length || 1))
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'EMAIL_PROVIDER_ERROR',
          message: error.response?.data?.message || error.message || 'Email could not be sent'
        }
      };
    }
  }
}
