import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Node,
  Edge,
  Connection
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { nodeTypes } from './Nodes';

function ConnectionSelect({ provider, value, onChange }: { provider: string, value: string, onChange: (val: string) => void }) {
  const [connections, setConnections] = useState<any[]>([]);
  useEffect(() => {
    // Assuming workspaceId is in localStorage or handled by fetch interceptors
    const workspaceId = localStorage.getItem('agentx_workspace_id') || '';
    fetch('/api/v1/connections', { headers: { 'x-workspace-id': workspaceId } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setConnections(data.filter(c => c.provider === provider));
        }
      })
      .catch(console.error);
  }, [provider]);

  return (
    <select 
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
    >
      <option value="" disabled>Select {provider} connection</option>
      {connections.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}

const initialId = () => `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

// Convert V0.4 DB JSON to ReactFlow nodes/edges
function parseDefinition(def: any) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  if (!def || !def.nodes) return { nodes, edges };

  def.nodes.forEach((n: any, i: number) => {
    nodes.push({
      id: n.id,
      type: n.type,
      position: n.position || { x: 250, y: i * 150 },
      data: { ...n.config }
    });

    if (n.type === 'control_condition') {
      if (n.config?.true_next) {
        edges.push({ id: `e-${n.id}-true`, source: n.id, sourceHandle: 'true', target: n.config.true_next });
      }
      if (n.config?.false_next) {
        edges.push({ id: `e-${n.id}-false`, source: n.id, sourceHandle: 'false', target: n.config.false_next });
      }
    } else if (n.next) {
      edges.push({ id: `e-${n.id}-${n.next}`, source: n.id, target: n.next });
    }
  });

  return { nodes, edges };
}

// Convert ReactFlow nodes/edges back to V0.4 DB JSON
function serializeGraph(nodes: Node[], edges: Edge[]) {
  const trigger = nodes.find(n => n.type?.startsWith('trigger'));
  const startNode = trigger ? trigger.id : (nodes[0]?.id || null);

  const outNodes = nodes.map(n => {
    const out: any = { id: n.id, type: n.type, position: n.position, config: { ...n.data } };
    if (n.type === 'control_condition') {
      const trueEdge = edges.find(e => e.source === n.id && e.sourceHandle === 'true');
      const falseEdge = edges.find(e => e.source === n.id && e.sourceHandle === 'false');
      out.config.true_next = trueEdge ? trueEdge.target : null;
      out.config.false_next = falseEdge ? falseEdge.target : null;
    } else {
      const edge = edges.find(e => e.source === n.id);
      out.next = edge ? edge.target : null;
    }
    return out;
  });

  return { startNode, nodes: outNodes };
}

interface WorkflowEditorProps {
  workflow: any;
  onSave: (definition: any) => void;
  onCancel: () => void;
}

function EditorContent({ workflow, onSave, onCancel }: WorkflowEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    const { nodes: initNodes, edges: initEdges } = parseDefinition(workflow.definition);
    setNodes(initNodes);
    setEdges(initEdges);
  }, [workflow]);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !wrapperRef.current) return;
      const reactFlowBounds = wrapperRef.current.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      const newNode = {
        id: initialId(),
        type,
        position,
        data: {},
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          node.data = { ...node.data, [key]: value };
        }
        return node;
      })
    );
    setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, [key]: value } } : null);
  };

  const handleSave = () => {
    const def = serializeGraph(nodes, edges);
    const errors = [];
    if (!def.startNode && nodes.length > 0) {
      errors.push('No trigger node found. Workflow may not start.');
    }
    
    // Check for isolated nodes
    const connectedNodeIds = new Set<string>();
    if (def.startNode) connectedNodeIds.add(def.startNode);
    edges.forEach(e => { connectedNodeIds.add(e.source); connectedNodeIds.add(e.target); });
    
    const isolated = nodes.filter(n => !connectedNodeIds.has(n.id) && !n.type?.startsWith('trigger_'));
    if (isolated.length > 0) {
      errors.push(`Warning: ${isolated.length} isolated/unconnected action node(s) detected.`);
    }

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }
    
    onSave(def);
  };

  return (
    <div className="flex h-[70vh] border rounded overflow-hidden relative" ref={wrapperRef}>
      {/* Node Palette Sidebar */}
      <div className="w-64 bg-muted/20 border-r p-4 flex flex-col gap-3 overflow-y-auto">
        <h3 className="font-semibold text-sm uppercase tracking-wider mb-1 mt-2">Triggers</h3>
        <div className="p-2 border bg-card rounded cursor-grab" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'trigger_manual')}>Manual Trigger</div>
        <div className="p-2 border bg-card rounded cursor-grab" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'trigger_webhook')}>Webhook</div>
        <div className="p-2 border bg-card rounded cursor-grab" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'trigger_schedule')}>Schedule</div>

        <h3 className="font-semibold text-sm uppercase tracking-wider mb-1 mt-2">Core Actions</h3>
        <div className="p-2 border bg-card rounded cursor-grab" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'action_ai_agent')}>AI Agent</div>
        <div className="p-2 border bg-card rounded cursor-grab" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'action_http')}>HTTP Request</div>
        <div className="p-2 border bg-card rounded cursor-grab" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'action_send_email')}>Send Email</div>
        <div className="p-2 border bg-card rounded cursor-grab" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'action_store_data')}>Store Data</div>
        <div className="p-2 border bg-card rounded cursor-grab" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'action_transform_data')}>Transform Data</div>
        <div className="p-2 border bg-card rounded cursor-grab" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'control_condition')}>Condition</div>

        <h3 className="font-semibold text-sm uppercase tracking-wider mb-1 mt-2 text-indigo-600">Integrations</h3>
        <div className="p-2 border bg-card rounded cursor-grab border-green-500/50" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'google_sheets_add_row')}>Google Sheets (Add Row)</div>
        <div className="p-2 border bg-card rounded cursor-grab border-green-500/50" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'google_sheets_find_row')}>Google Sheets (Find Row)</div>
        <div className="p-2 border bg-card rounded cursor-grab border-green-500/50" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'google_sheets_update_row')}>Google Sheets (Update Row)</div>
        <div className="p-2 border bg-card rounded cursor-grab border-rose-500/50" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'slack_send_message')}>Slack (Send Message)</div>
        <div className="p-2 border bg-card rounded cursor-grab border-indigo-500/50" draggable onDragStart={(e) => e.dataTransfer.setData('application/reactflow', 'discord_send_message')}>Discord (Send Message)</div>
      </div>

      {/* Canvas */}
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Properties Sidebar */}
      {selectedNode && (
        <div className="w-72 bg-card border-l p-4 flex flex-col gap-4 overflow-y-auto z-10 shadow-lg">
          <h3 className="font-semibold border-b pb-2">Edit: {selectedNode.type}</h3>
          
          {selectedNode.type === 'trigger_schedule' && (
            <>
              <div>
                <label className="text-xs font-medium mb-1 block">Schedule Preset</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={selectedNode.data.preset as string || 'custom'}
                  onChange={e => {
                    updateNodeData('preset', e.target.value);
                    if (e.target.value !== 'custom') {
                      updateNodeData('cron', e.target.value);
                    }
                  }}
                >
                  <option value="custom">Custom Cron</option>
                  <option value="*/5 * * * *">Every 5 minutes</option>
                  <option value="*/15 * * * *">Every 15 minutes</option>
                  <option value="0 * * * *">Every hour</option>
                  <option value="0 9 * * *">Every day at 9 AM</option>
                </select>
              </div>
              
              {(!selectedNode.data.preset || selectedNode.data.preset === 'custom') && (
                <div>
                  <label className="text-xs font-medium">Cron Expression</label>
                  <Input placeholder="0 9 * * *" value={selectedNode.data.cron as string || ''} onChange={e => updateNodeData('cron', e.target.value)} />
                </div>
              )}
              
              <div>
                <label className="text-xs font-medium">Timezone</label>
                <Input placeholder="Asia/Kolkata" value={selectedNode.data.timezone as string || ''} onChange={e => updateNodeData('timezone', e.target.value)} />
              </div>
            </>
          )}

          {selectedNode.type === 'action_ai_agent' && (
            <>
              <div><label className="text-xs font-medium">Agent ID</label><Input value={selectedNode.data.agent_id as string || ''} onChange={e => updateNodeData('agent_id', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Prompt (supports {'{{var}}'})</label><Input value={selectedNode.data.prompt as string || ''} onChange={e => updateNodeData('prompt', e.target.value)} /></div>
            </>
          )}

          {selectedNode.type === 'action_http' && (
            <>
              <div><label className="text-xs font-medium">Method</label><Input value={selectedNode.data.method as string || 'GET'} onChange={e => updateNodeData('method', e.target.value)} /></div>
              <div><label className="text-xs font-medium">URL</label><Input value={selectedNode.data.url as string || ''} onChange={e => updateNodeData('url', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Body (JSON string)</label><Input value={selectedNode.data.body as string || ''} onChange={e => updateNodeData('body', e.target.value)} /></div>
            </>
          )}

          {selectedNode.type === 'action_send_email' && (
            <>
              <div><label className="text-xs font-medium">To (Email)</label><Input value={selectedNode.data.to as string || ''} onChange={e => updateNodeData('to', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Subject</label><Input value={selectedNode.data.subject as string || ''} onChange={e => updateNodeData('subject', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Body</label><Input value={selectedNode.data.body as string || ''} onChange={e => updateNodeData('body', e.target.value)} /></div>
            </>
          )}

          {selectedNode.type === 'action_store_data' && (
            <>
              <div><label className="text-xs font-medium">Collection</label><Input value={selectedNode.data.collection as string || ''} onChange={e => updateNodeData('collection', e.target.value)} /></div>
              <div>
                <label className="text-xs font-medium">JSON Data</label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  rows={4}
                  value={selectedNode.data.data ? (typeof selectedNode.data.data === 'string' ? selectedNode.data.data : JSON.stringify(selectedNode.data.data, null, 2)) : ''} 
                  onChange={e => {
                    try {
                      updateNodeData('data', JSON.parse(e.target.value));
                    } catch {
                      updateNodeData('data', e.target.value);
                    }
                  }} 
                />
              </div>
            </>
          )}

          {selectedNode.type === 'action_transform_data' && (
            <>
              <div>
                <label className="text-xs font-medium">Input Data (JSON / String)</label>
                <Input value={selectedNode.data.input as string || ''} onChange={e => updateNodeData('input', e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-1">E.g., {`{"name":"{{trigger.name}}"}`}</p>
              </div>
              <div>
                <label className="text-xs font-medium">Operations (JSON Array)</label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  rows={5}
                  value={selectedNode.data.operations ? (typeof selectedNode.data.operations === 'string' ? selectedNode.data.operations : JSON.stringify(selectedNode.data.operations, null, 2)) : '[]'} 
                  onChange={e => {
                    try {
                      updateNodeData('operations', JSON.parse(e.target.value));
                    } catch {
                      updateNodeData('operations', e.target.value); // Keep string while typing
                    }
                  }} 
                />
                <p className="text-[10px] text-muted-foreground mt-1">E.g., {`[{"type":"uppercase","field":"name"}]`}</p>
              </div>
            </>
          )}

          {selectedNode.type === 'control_condition' && (
            <>
              <div><label className="text-xs font-medium">Left Value</label><Input value={selectedNode.data.left as string || ''} onChange={e => updateNodeData('left', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Operator</label><Input value={selectedNode.data.operator as string || '=='} onChange={e => updateNodeData('operator', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Right Value</label><Input value={selectedNode.data.right as string || ''} onChange={e => updateNodeData('right', e.target.value)} /></div>
            </>
          )}

          {selectedNode.type === 'google_sheets_add_row' && (
            <>
              <div><label className="text-xs font-medium mb-1 block">Connection</label><ConnectionSelect provider="google_sheets" value={selectedNode.data.connectionId as string} onChange={val => updateNodeData('connectionId', val)} /></div>
              <div><label className="text-xs font-medium">Spreadsheet ID</label><Input value={selectedNode.data.spreadsheetId as string || ''} onChange={e => updateNodeData('spreadsheetId', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Sheet Name</label><Input value={selectedNode.data.sheetName as string || ''} onChange={e => updateNodeData('sheetName', e.target.value)} /></div>
              <div>
                <label className="text-xs font-medium">Values (JSON Array)</label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  rows={4}
                  value={selectedNode.data.values ? (typeof selectedNode.data.values === 'string' ? selectedNode.data.values : JSON.stringify(selectedNode.data.values, null, 2)) : '[]'} 
                  onChange={e => {
                    try { updateNodeData('values', JSON.parse(e.target.value)); } catch { updateNodeData('values', e.target.value); }
                  }} 
                />
              </div>
            </>
          )}

          {selectedNode.type === 'google_sheets_find_row' && (
            <>
              <div><label className="text-xs font-medium mb-1 block">Connection</label><ConnectionSelect provider="google_sheets" value={selectedNode.data.connectionId as string} onChange={val => updateNodeData('connectionId', val)} /></div>
              <div><label className="text-xs font-medium">Spreadsheet ID</label><Input value={selectedNode.data.spreadsheetId as string || ''} onChange={e => updateNodeData('spreadsheetId', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Sheet Name</label><Input value={selectedNode.data.sheetName as string || ''} onChange={e => updateNodeData('sheetName', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Column (e.g. A, B or 0, 1)</label><Input value={selectedNode.data.column as string || ''} onChange={e => updateNodeData('column', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Search Value</label><Input value={selectedNode.data.value as string || ''} onChange={e => updateNodeData('value', e.target.value)} /></div>
            </>
          )}

          {selectedNode.type === 'google_sheets_update_row' && (
            <>
              <div><label className="text-xs font-medium mb-1 block">Connection</label><ConnectionSelect provider="google_sheets" value={selectedNode.data.connectionId as string} onChange={val => updateNodeData('connectionId', val)} /></div>
              <div><label className="text-xs font-medium">Spreadsheet ID</label><Input value={selectedNode.data.spreadsheetId as string || ''} onChange={e => updateNodeData('spreadsheetId', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Sheet Name</label><Input value={selectedNode.data.sheetName as string || ''} onChange={e => updateNodeData('sheetName', e.target.value)} /></div>
              <div><label className="text-xs font-medium">Row Number (1-indexed)</label><Input type="number" value={selectedNode.data.rowNumber as string || ''} onChange={e => updateNodeData('rowNumber', parseInt(e.target.value, 10))} /></div>
              <div>
                <label className="text-xs font-medium">Values (JSON Array)</label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  rows={4}
                  value={selectedNode.data.values ? (typeof selectedNode.data.values === 'string' ? selectedNode.data.values : JSON.stringify(selectedNode.data.values, null, 2)) : '[]'} 
                  onChange={e => {
                    try { updateNodeData('values', JSON.parse(e.target.value)); } catch { updateNodeData('values', e.target.value); }
                  }} 
                />
              </div>
            </>
          )}

          {selectedNode.type === 'slack_send_message' && (
            <>
              <div><label className="text-xs font-medium mb-1 block">Connection</label><ConnectionSelect provider="slack" value={selectedNode.data.connectionId as string} onChange={val => updateNodeData('connectionId', val)} /></div>
              <div><label className="text-xs font-medium">Channel (e.g. #general)</label><Input value={selectedNode.data.channel as string || ''} onChange={e => updateNodeData('channel', e.target.value)} /></div>
              <div>
                <label className="text-xs font-medium">Message (supports interpolation)</label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  rows={4}
                  value={selectedNode.data.message as string || ''} 
                  onChange={e => updateNodeData('message', e.target.value)} 
                />
              </div>
            </>
          )}

          {selectedNode.type === 'discord_send_message' && (
            <>
              <div><label className="text-xs font-medium mb-1 block">Connection</label><ConnectionSelect provider="discord" value={selectedNode.data.connectionId as string} onChange={val => updateNodeData('connectionId', val)} /></div>
              <div><label className="text-xs font-medium">Channel ID (or Webhook URL)</label><Input value={selectedNode.data.channelId as string || ''} onChange={e => updateNodeData('channelId', e.target.value)} /></div>
              <div>
                <label className="text-xs font-medium">Message (supports interpolation)</label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  rows={4}
                  value={selectedNode.data.message as string || ''} 
                  onChange={e => updateNodeData('message', e.target.value)} 
                />
              </div>
            </>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-4 border-t">
            <Button onClick={() => setNodes(nds => nds.filter(n => n.id !== selectedNode.id))} variant="destructive" size="sm">Delete Node</Button>
          </div>
        </div>
      )}

      {/* Top Floating Bar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button onClick={handleSave}>Save Graph</Button>
        <Button variant="outline" className="bg-background" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorContent {...props} />
    </ReactFlowProvider>
  );
}
