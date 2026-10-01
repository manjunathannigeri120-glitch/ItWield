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

    // 1. Fetch ALL connected systems for this workspace
    const { data: systems, error: sysErr } = await context.supabase
       .from('company_systems')
       .select('*')
       .eq('workspace_id', context.workspaceId)
       .eq('status', 'CONNECTED');

    if (sysErr || !systems || systems.length === 0) {
       return { success: false, error: { message: 'No active connections found for this workspace.' } };
    }

    // 2. Find the one that has SEND_EMAILS capability
    const system = systems.find(s => (s.capabilities || []).includes('SEND_EMAILS'));

    if (!system) {
       return { success: false, error: { message: 'No configured connection has the SEND_EMAILS capability enabled by the founder. Please authorize an Email Provider.' } };
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
    const toArray = typeof to === 'string' ? to.split(',').map((e: string) => e.trim()) : to;
    
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
              const ccArray = typeof cc === 'string' ? cc.split(',').map((e: string) => e.trim()) : cc;
              payload.cc = ccArray.map((e: string) => ({ email: e }));
          }
          if (bcc) {
              const bccArray = typeof bcc === 'string' ? bcc.split(',').map((e: string) => e.trim()) : bcc;
              payload.bcc = bccArray.map((e: string) => ({ email: e }));
          }

          const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json', 'accept': 'application/json' }
          });
          return { success: true, sent: true, provider: 'BREVO', messageId: response.data?.messageId };
          
      } else if (system.system_type === 'TWILIO_SENDGRID') {
          const payload: any = {
              personalizations: [{ to: toArray.map((e: string) => ({ email: e })) }],
              from: { email: senderEmail, name: senderName },
              subject: subject,
              content: []
          };
          if (text) payload.content.push({ type: 'text/plain', value: text });
          if (html) payload.content.push({ type: 'text/html', value: html });
          
          const response = await axios.post('https://api.sendgrid.com/v3/mail/send', payload, {
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
          });
          return { success: true, sent: true, provider: 'TWILIO_SENDGRID', messageId: response.headers['x-message-id'] || 'sent' };
          
      } else {
          // Graceful fallback for unimplemented native providers
          return {
              success: false, 
              error: { 
                  code: 'NOT_IMPLEMENTED', 
                  message: `The AI currently supports native sending via Resend, Brevo, and SendGrid. Support for ${system.system_type} API payloads is being added in the next release.` 
              }
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'EMAIL_PROVIDER_ERROR',
          message: error.response?.data?.message || error.response?.data?.errors?.[0]?.message || error.message || 'Email could not be sent'
        }
      };
    }
  }
}
