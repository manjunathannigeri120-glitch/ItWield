/**
 * V1.2: Machine-readable catalog of all supported Dovia workflow nodes/actions.
 * This is the ONLY set of node types the AI generator is allowed to produce.
 * Adding a new action here automatically makes it available to the generator.
 */

export interface NodeInput {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'connection' | 'agent_id';
  description: string;
  required: boolean;
  /** example value to guide the AI */
  example?: any;
}

export interface NodeOutput {
  type: string;
  description: string;
}

export interface NodeCatalogEntry {
  type: string;
  category: 'trigger' | 'action' | 'integration' | 'control';
  label: string;
  description: string;
  inputs: Record<string, NodeInput>;
  outputs: Record<string, NodeOutput>;
  /** Which provider connection this node requires (if any) */
  requiresConnectionProvider?: string;
}

export const NODE_CATALOG: NodeCatalogEntry[] = [
  // ─── TRIGGERS ────────────────────────────────────────────────────────────────
  {
    type: 'trigger_manual',
    category: 'trigger',
    label: 'Manual Trigger',
    description: 'Triggered manually by the user via the Run button.',
    inputs: {},
    outputs: { output: { type: 'object', description: 'Any data passed at trigger time' } }
  },
  {
    type: 'trigger_webhook',
    category: 'trigger',
    label: 'Webhook',
    description: 'Triggered by an incoming HTTP POST to the workflow webhook URL.',
    inputs: {
      method: { type: 'string', description: 'HTTP method (POST)', required: false, example: 'POST' }
    },
    outputs: {
      output: { type: 'object', description: 'The parsed JSON body of the incoming webhook request' }
    }
  },
  {
    type: 'trigger_schedule',
    category: 'trigger',
    label: 'Scheduled Trigger',
    description: 'Triggered on a cron schedule.',
    inputs: {
      cron: { type: 'string', description: 'Cron expression e.g. "0 9 * * 1" for every Monday at 9am', required: true, example: '0 9 * * 1' },
      timezone: { type: 'string', description: 'IANA timezone e.g. "America/New_York"', required: true, example: 'UTC' }
    },
    outputs: { output: { type: 'object', description: 'Trigger timestamp metadata' } }
  },

  // ─── CORE ACTIONS ─────────────────────────────────────────────────────────────
  {
    type: 'action_http',
    category: 'action',
    label: 'HTTP Request',
    description: 'Makes a secure HTTP request to an external URL. Passes through SSRF protection.',
    inputs: {
      url: { type: 'string', description: 'Target URL', required: true, example: 'https://api.example.com/data' },
      method: { type: 'string', description: 'HTTP method: GET, POST, PUT, PATCH, DELETE', required: true, example: 'GET' },
      headers: { type: 'object', description: 'Optional HTTP headers', required: false },
      body: { type: 'object', description: 'Optional request body (for POST/PUT)', required: false }
    },
    outputs: {
      status: { type: 'number', description: 'HTTP response status code' },
      body: { type: 'object', description: 'Response body' }
    }
  },
  {
    type: 'action_ai_agent',
    category: 'action',
    label: 'AI Agent',
    description: 'Runs an Dovia AI agent with a given prompt.',
    inputs: {
      agent_id: { type: 'agent_id', description: 'ID of an agent in the current workspace', required: true },
      prompt: { type: 'string', description: 'Prompt to send to the agent. Supports {{variable}} syntax.', required: true, example: 'Summarize: {{trigger_webhook.output.text}}' }
    },
    outputs: {
      response: { type: 'string', description: 'The agent response text' }
    }
  },
  {
    type: 'action_send_email',
    category: 'action',
    label: 'Send Email',
    description: 'Sends an email via the configured email provider.',
    inputs: {
      to: { type: 'string', description: 'Recipient email address. Supports {{variable}} syntax.', required: true, example: '{{trigger_webhook.output.email}}' },
      subject: { type: 'string', description: 'Email subject line', required: true },
      text: { type: 'string', description: 'Plain text body', required: false },
      html: { type: 'string', description: 'HTML body (alternative to text)', required: false }
    },
    outputs: {
      success: { type: 'boolean', description: 'Whether the email was sent' },
      messageId: { type: 'string', description: 'Email message ID from provider' }
    }
  },
  {
    type: 'action_store_data',
    category: 'action',
    label: 'Store Data',
    description: 'Stores a key-value record in workspace data storage.',
    inputs: {
      key: { type: 'string', description: 'Storage key', required: true },
      value: { type: 'object', description: 'Value to store. Supports {{variable}} syntax.', required: true }
    },
    outputs: {
      success: { type: 'boolean', description: 'Whether storage succeeded' }
    }
  },
  {
    type: 'action_transform_data',
    category: 'action',
    label: 'Transform Data',
    description: 'Transforms data using safe built-in operations (uppercase, lowercase, trim, pick, rename, remove, etc.).',
    inputs: {
      input: { type: 'string', description: 'Input data or variable reference e.g. {{trigger_webhook.output}}', required: true },
      operations: {
        type: 'array',
        description: 'Array of transformation operations. Each op has a "type" and optional "field"/"value"/"fields".',
        required: true,
        example: [{ type: 'uppercase', field: 'name' }, { type: 'trim', field: 'email' }]
      }
    },
    outputs: {
      transformed: { type: 'object', description: 'The transformed result' }
    }
  },

  // ─── INTEGRATIONS ─────────────────────────────────────────────────────────────
  {
    type: 'google_sheets_add_row',
    category: 'integration',
    label: 'Google Sheets — Add Row',
    description: 'Appends a new row to a Google Sheet.',
    requiresConnectionProvider: 'google_sheets',
    inputs: {
      connectionId: { type: 'connection', description: 'ID of a google_sheets connection', required: true },
      spreadsheetId: { type: 'string', description: 'Google Sheets spreadsheet ID', required: true },
      sheetName: { type: 'string', description: 'Sheet/tab name e.g. "Sheet1"', required: true, example: 'Sheet1' },
      values: { type: 'array', description: 'Array of cell values for the new row', required: true, example: ['{{trigger_webhook.output.name}}', '{{trigger_webhook.output.email}}'] }
    },
    outputs: {
      success: { type: 'boolean', description: 'Whether the row was added' },
      rowNumber: { type: 'number', description: 'Row number of the newly added row' }
    }
  },
  {
    type: 'google_sheets_find_row',
    category: 'integration',
    label: 'Google Sheets — Find Row',
    description: 'Searches a Google Sheet column for a value and returns the matching row.',
    requiresConnectionProvider: 'google_sheets',
    inputs: {
      connectionId: { type: 'connection', description: 'ID of a google_sheets connection', required: true },
      spreadsheetId: { type: 'string', description: 'Google Sheets spreadsheet ID', required: true },
      sheetName: { type: 'string', description: 'Sheet/tab name', required: true, example: 'Sheet1' },
      column: { type: 'string', description: 'Column letter to search e.g. "A"', required: true, example: 'A' },
      value: { type: 'string', description: 'Value to search for. Supports {{variable}} syntax.', required: true }
    },
    outputs: {
      found: { type: 'boolean', description: 'True if a matching row was found' },
      row: { type: 'object', description: 'The matching row data' },
      rowNumber: { type: 'number', description: 'Row number of the matching row' }
    }
  },
  {
    type: 'google_sheets_update_row',
    category: 'integration',
    label: 'Google Sheets — Update Row',
    description: 'Updates a specific row in a Google Sheet.',
    requiresConnectionProvider: 'google_sheets',
    inputs: {
      connectionId: { type: 'connection', description: 'ID of a google_sheets connection', required: true },
      spreadsheetId: { type: 'string', description: 'Google Sheets spreadsheet ID', required: true },
      sheetName: { type: 'string', description: 'Sheet/tab name', required: true, example: 'Sheet1' },
      rowNumber: { type: 'number', description: 'Row number to update. Supports {{variable}} syntax.', required: true },
      values: { type: 'array', description: 'Array of new cell values', required: true }
    },
    outputs: {
      success: { type: 'boolean', description: 'Whether the row was updated' }
    }
  },
  {
    type: 'slack_send_message',
    category: 'integration',
    label: 'Slack — Send Message',
    description: 'Sends a message to a Slack channel.',
    requiresConnectionProvider: 'slack',
    inputs: {
      connectionId: { type: 'connection', description: 'ID of a slack connection', required: true },
      channel: { type: 'string', description: 'Slack channel name e.g. "#general"', required: true, example: '#general' },
      message: { type: 'string', description: 'Message text. Supports {{variable}} syntax.', required: true }
    },
    outputs: {
      sent: { type: 'boolean', description: 'Whether the message was sent' },
      timestamp: { type: 'string', description: 'Slack message timestamp' }
    }
  },
  {
    type: 'discord_send_message',
    category: 'integration',
    label: 'Discord — Send Message',
    description: 'Sends a message to a Discord channel via webhook or bot.',
    requiresConnectionProvider: 'discord',
    inputs: {
      connectionId: { type: 'connection', description: 'ID of a discord connection', required: true },
      channelId: { type: 'string', description: 'Discord channel ID (required if using bot token)', required: false },
      message: { type: 'string', description: 'Message content. Supports {{variable}} syntax.', required: true }
    },
    outputs: {
      sent: { type: 'boolean', description: 'Whether the message was sent' }
    }
  },

  // ─── CONTROL FLOW ──────────────────────────────────────────────────────────────
  {
    type: 'control_condition',
    category: 'control',
    label: 'Condition',
    description: 'Branches workflow based on a boolean comparison.',
    inputs: {
      left: { type: 'string', description: 'Left operand. Supports {{variable}} syntax.', required: true },
      operator: { type: 'string', description: 'Comparison operator: ==, !=, >, <', required: true, example: '==' },
      right: { type: 'string', description: 'Right operand', required: true },
      true_next: { type: 'string', description: 'Node ID to go to when condition is true', required: false },
      false_next: { type: 'string', description: 'Node ID to go to when condition is false', required: false }
    },
    outputs: {
      evaluated_true: { type: 'boolean', description: 'Whether the condition evaluated to true' }
    }
  }
];

/** Set of valid node types for fast O(1) validation */
export const VALID_NODE_TYPES = new Set(NODE_CATALOG.map(n => n.type));

/** Get catalog entry by type */
export function getCatalogEntry(type: string): NodeCatalogEntry | undefined {
  return NODE_CATALOG.find(n => n.type === type);
}
