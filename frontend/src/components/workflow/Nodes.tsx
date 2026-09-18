import { Handle, Position } from '@xyflow/react';

const nodeStyle = "border rounded-md bg-card p-3 shadow-sm min-w-[150px] text-sm";
const headerStyle = "font-semibold mb-2 pb-1 border-b text-xs uppercase tracking-wider";

export function TriggerManualNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-green-500/50`}>
      <div className={`${headerStyle} text-green-500`}>Manual Trigger</div>
      <div className="text-muted-foreground">{data.name || 'Start'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </div>
  );
}

export function TriggerWebhookNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-green-500/50`}>
      <div className={`${headerStyle} text-green-500`}>Webhook Trigger</div>
      <div className="text-muted-foreground">{data.name || 'Webhook'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </div>
  );
}

export function ActionAiAgentNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-blue-500/50`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      <div className={`${headerStyle} text-blue-500`}>AI Agent</div>
      <div className="text-muted-foreground truncate">{data.agent_id ? `Agent: ${data.agent_id}` : 'Unconfigured'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
}

export function ActionHttpNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-purple-500/50`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      <div className={`${headerStyle} text-purple-500`}>HTTP Request</div>
      <div className="text-muted-foreground truncate">{data.url || 'Unconfigured'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
    </div>
  );
}

export function ControlConditionNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-orange-500/50`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      <div className={`${headerStyle} text-orange-500`}>Condition</div>
      <div className="text-muted-foreground truncate">{data.left} {data.operator} {data.right}</div>
      <div className="flex justify-between mt-4 text-[10px] uppercase font-bold text-muted-foreground">
        <span>True</span>
        <span>False</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} className="w-3 h-3 bg-red-500" />
    </div>
  );
}

export function TriggerScheduleNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-green-500/50`}>
      <div className={`${headerStyle} text-green-500`}>Schedule Trigger</div>
      <div className="text-muted-foreground truncate">{data.cron ? `Cron: ${data.cron}` : 'Unconfigured'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </div>
  );
}

export function ActionSendEmailNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-pink-500/50`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      <div className={`${headerStyle} text-pink-500`}>Send Email</div>
      <div className="text-muted-foreground truncate">{data.to ? `To: ${data.to}` : 'Unconfigured'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-pink-500" />
    </div>
  );
}

export function ActionStoreDataNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-teal-500/50`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      <div className={`${headerStyle} text-teal-500`}>Store Data</div>
      <div className="text-muted-foreground truncate">{data.collection ? `Collection: ${data.collection}` : 'Unconfigured'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-teal-500" />
    </div>
  );
}

export function ActionTransformDataNode() {
  return (
    <div className={`${nodeStyle} border-yellow-500/50`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      <div className={`${headerStyle} text-yellow-500`}>Transform Data</div>
      <div className="text-muted-foreground truncate">Template interpolation</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-500" />
    </div>
  );
}

export function ActionIntegrationGoogleSheetsNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-green-600/50`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      <div className={`${headerStyle} text-green-600`}>Google Sheets</div>
      <div className="text-muted-foreground truncate">{data.action ? data.action : 'Unconfigured'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-600" />
    </div>
  );
}

export function ActionIntegrationSlackNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-rose-500/50`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      <div className={`${headerStyle} text-rose-500`}>Slack</div>
      <div className="text-muted-foreground truncate">{data.channel ? `To: ${data.channel}` : 'Unconfigured'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-rose-500" />
    </div>
  );
}

export function ActionIntegrationDiscordNode({ data }: any) {
  return (
    <div className={`${nodeStyle} border-indigo-500/50`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
      <div className={`${headerStyle} text-indigo-500`}>Discord</div>
      <div className="text-muted-foreground truncate">{data.channelId || data.webhookUrl ? 'Configured' : 'Unconfigured'}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
}

export const nodeTypes = {
  trigger_manual: TriggerManualNode,
  trigger_webhook: TriggerWebhookNode,
  trigger_schedule: TriggerScheduleNode,
  action_ai_agent: ActionAiAgentNode,
  action_http: ActionHttpNode,
  action_send_email: ActionSendEmailNode,
  action_store_data: ActionStoreDataNode,
  action_transform_data: ActionTransformDataNode,
  control_condition: ControlConditionNode,
  
  google_sheets_add_row: ActionIntegrationGoogleSheetsNode,
  google_sheets_find_row: ActionIntegrationGoogleSheetsNode,
  google_sheets_update_row: ActionIntegrationGoogleSheetsNode,
  slack_send_message: ActionIntegrationSlackNode,
  discord_send_message: ActionIntegrationDiscordNode,
};
