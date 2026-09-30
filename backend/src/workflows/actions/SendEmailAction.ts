import { Action, ActionContext } from './Action';
import axios from 'axios';
import { decryptObject } from '../../utils/encryption';

export class SendEmailAction implements Action {
  id = 'action_send_email';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { to, subject, text, html, cc, bcc, replyTo } = config;
    if (!to || !subject) throw new Error('Missing required email fields (to, subject)');
    if (!text && !html) throw new Error('Missing required email fields (text or html must be provided)');
    if (!context.workspaceId || !context.supabase) throw new Error('Missing workspace context for execution');

    // 1. Fetch RESEND connection from company_systems
    const { data: system, error: sysErr } = await context.supabase
       .from('company_systems')
       .select('*')
       .eq('workspace_id', context.workspaceId)
       .eq('system_type', 'RESEND')
       .eq('status', 'CONNECTED')
       .single();

    if (sysErr || !system) {
       return { success: false, error: { message: 'Resend connection is not configured for this workspace.' } };
    }

    // 2. Validate Capability
    const capabilities = system.capabilities || [];
    if (!capabilities.includes('SEND_EMAILS')) {
       return { success: false, error: { message: 'The Resend connection does not have the SEND_EMAILS capability enabled by the founder.' } };
    }

    // 3. Decrypt credentials
    let credentials: any = {};
    try {
       credentials = decryptObject(system.connection_id);
    } catch (e) {
       return { success: false, error: { message: 'Failed to decrypt Resend credentials.' } };
    }

    const apiKey = credentials.apiKey;
    if (!apiKey) {
      return { success: false, error: { message: 'Resend API key is missing from connection.' } };
    }

    try {
      const payload: any = {
        from: credentials.fromEmail || process.env.RESEND_FROM_EMAIL || 'Acme <onboarding@resend.dev>',
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
