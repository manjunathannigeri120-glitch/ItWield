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

    // 1. Fetch Email connection from company_systems
    const { data: systems, error: sysErr } = await context.supabase
       .from('company_systems')
       .select('*')
       .eq('workspace_id', context.workspaceId)
       .in('system_type', ['RESEND', 'BREVO'])
       .eq('status', 'CONNECTED');

    if (sysErr || !systems || systems.length === 0) {
       return { success: false, error: { message: 'No active email connection (Resend or Brevo) configured for this workspace.' } };
    }

    const system = systems[0];

    // 2. Validate Capability
    const capabilities = system.capabilities || [];
    if (!capabilities.includes('SEND_EMAILS')) {
       return { success: false, error: { message: `The ${system.system_type} connection does not have the SEND_EMAILS capability enabled by the founder.` } };
    }

    // 3. Decrypt credentials
    let credentials: any = {};
    try {
       credentials = decryptObject(system.connection_id);
    } catch (e) {
       return { success: false, error: { message: `Failed to decrypt ${system.system_type} credentials.` } };
    }

    const apiKey = credentials.apiKey;
    if (!apiKey) {
      return { success: false, error: { message: `${system.system_type} API key is missing from connection.` } };
    }

    const senderEmail = credentials.fromEmail || process.env.FROM_EMAIL || 'onboarding@example.com';
    const senderName = credentials.fromName || 'Acme Corp';

    const toArray = typeof to === 'string' ? to.split(',').map(e => e.trim()) : to;
    
    try {
      if (system.system_type === 'RESEND') {
          const payload: any = {
            from: `${senderName} <${senderEmail}>`,
            to: toArray,
            subject, text, html, cc, bcc, reply_to: replyTo
          };
          Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

          const response = await axios.post('https://api.resend.com/emails', payload, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
          });
          return { success: true, sent: true, provider: 'RESEND', messageId: response.data?.id };
      } else if (system.system_type === 'BREVO') {
          const payload: any = {
            sender: { name: senderName, email: senderEmail },
            to: toArray.map((e: string) => ({ email: e })),
            subject: subject
          };
          if (html) payload.htmlContent = html;
          if (text) payload.textContent = text;
          if (replyTo) payload.replyTo = { email: replyTo };
          
          if (cc) {
              const ccArray = typeof cc === 'string' ? cc.split(',').map(e => e.trim()) : cc;
              payload.cc = ccArray.map((e: string) => ({ email: e }));
          }
          if (bcc) {
              const bccArray = typeof bcc === 'string' ? bcc.split(',').map(e => e.trim()) : bcc;
              payload.bcc = bccArray.map((e: string) => ({ email: e }));
          }

          const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json', 'accept': 'application/json' }
          });
          return { success: true, sent: true, provider: 'BREVO', messageId: response.data?.messageId };
      }
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
