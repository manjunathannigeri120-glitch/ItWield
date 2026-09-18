/**
 * V1.2: Strict server-side validation for AI-generated workflow definitions.
 * This is the security boundary — invalid or dangerous workflows are rejected here.
 * The WorkflowEngine NEVER receives a workflow that has not passed this validator.
 */

import { VALID_NODE_TYPES, getCatalogEntry } from './workflowCatalog';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Patterns that must never appear in generated config values
const DANGEROUS_PATTERNS = [
  /eval\s*\(/i,
  /new\s+Function\s*\(/i,
  /Function\s*\(/i,
  /require\s*\(/i,
  /process\s*\.\s*env/i,
  /child_process/i,
  /exec\s*\(/i,
  /spawn\s*\(/i,
  /\bsystem\s*\(/i,
  /__proto__/i,
  /constructor\s*\[/i,
  /setTimeout\s*\(\s*['"]/i,
  /setInterval\s*\(\s*['"]/i,
];

// Private/local IP ranges that must not appear in HTTP action URLs
const PRIVATE_IP_PATTERNS = [
  /https?:\/\/localhost/i,
  /https?:\/\/127\./,
  /https?:\/\/0\.0\.0\.0/,
  /https?:\/\/10\./,
  /https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /https?:\/\/192\.168\./,
  /https?:\/\/169\.254\./,    // link-local
  /https?:\/\/::1/,           // IPv6 loopback
  /https?:\/\/\[?fc00:/i,     // IPv6 ULA
];

function scanStringForDanger(value: string, path: string): string[] {
  const errors: string[] = [];
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(value)) {
      errors.push(`Dangerous pattern detected in "${path}": forbidden code construct`);
    }
  }
  return errors;
}

function scanObjectForDanger(obj: any, path = 'config'): string[] {
  const errors: string[] = [];
  if (typeof obj === 'string') {
    errors.push(...scanStringForDanger(obj, path));
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => errors.push(...scanObjectForDanger(item, `${path}[${i}]`)));
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      errors.push(...scanObjectForDanger(obj[key], `${path}.${key}`));
    }
  }
  return errors;
}

export function validateWorkflowDefinition(
  definition: any,
  availableConnectionIds: Set<string>,
  availableAgentIds: Set<string>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ─── Basic Structure ─────────────────────────────────────────────────────────
  if (!definition || typeof definition !== 'object') {
    return { valid: false, errors: ['Definition must be an object'], warnings };
  }
  if (!Array.isArray(definition.nodes)) {
    return { valid: false, errors: ['Definition must have a "nodes" array'], warnings };
  }
  if (definition.nodes.length === 0) {
    return { valid: false, errors: ['Workflow must have at least one node'], warnings };
  }
  if (definition.nodes.length > 30) {
    return { valid: false, errors: [`Workflow has too many nodes (${definition.nodes.length}). Maximum is 30.`], warnings };
  }

  const nodes: any[] = definition.nodes;
  const nodeIds = new Set<string>();

  // ─── Node-level validation ───────────────────────────────────────────────────
  for (const node of nodes) {
    if (!node.id || typeof node.id !== 'string') {
      errors.push('Each node must have a string "id"');
      continue;
    }
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: "${node.id}"`);
      continue;
    }
    nodeIds.add(node.id);

    // Node type must be in the catalog
    if (!node.type || !VALID_NODE_TYPES.has(node.type)) {
      errors.push(`Invalid node type "${node.type}" on node "${node.id}". Only catalog types are allowed.`);
      continue;
    }

    // Scan config for dangerous patterns
    if (node.config) {
      const dangerErrors = scanObjectForDanger(node.config, `node[${node.id}].config`);
      errors.push(...dangerErrors);
    }

    const entry = getCatalogEntry(node.type)!;

    // Validate required inputs exist
    for (const [inputName, inputDef] of Object.entries(entry.inputs)) {
      if (inputDef.required && (node.config?.[inputName] === undefined || node.config?.[inputName] === null || node.config?.[inputName] === '')) {
        errors.push(`Node "${node.id}" (${node.type}) missing required input: "${inputName}"`);
      }
    }

    // Validate connection references
    if (entry.requiresConnectionProvider) {
      const connId = node.config?.connectionId;
      if (connId && connId !== 'PLACEHOLDER' && !availableConnectionIds.has(connId)) {
        errors.push(`Node "${node.id}" references connection "${connId}" which is not accessible to this workspace.`);
      }
    }

    // Validate agent references
    if (node.type === 'action_ai_agent') {
      const agentId = node.config?.agent_id;
      if (agentId && agentId !== 'PLACEHOLDER' && !availableAgentIds.has(agentId)) {
        errors.push(`Node "${node.id}" references agent "${agentId}" which is not accessible to this workspace.`);
      }
    }

    // Validate HTTP URLs against private IP ranges
    if (node.type === 'action_http' && node.config?.url) {
      const url = String(node.config.url);
      // Only validate non-template URLs (templates contain {{...}})
      if (!url.includes('{{')) {
        for (const pattern of PRIVATE_IP_PATTERNS) {
          if (pattern.test(url)) {
            errors.push(`Node "${node.id}" HTTP action URL targets a private/local address which is forbidden.`);
          }
        }
      }
    }

    // Validate transform operations whitelist
    if (node.type === 'action_transform_data' && Array.isArray(node.config?.operations)) {
      const ALLOWED_OPS = new Set(['uppercase', 'lowercase', 'trim', 'to_number', 'to_string', 'to_boolean', 'pick', 'rename', 'remove', 'concat', 'add', 'subtract', 'multiply', 'divide']);
      for (const op of node.config.operations) {
        if (!op.type || !ALLOWED_OPS.has(op.type)) {
          errors.push(`Node "${node.id}" has unsupported transform operation: "${op?.type}"`);
        }
      }
    }
  }

  // ─── Graph / Edge Validation ─────────────────────────────────────────────────
  // All node references (next, true_next, false_next) must point to existing nodes
  for (const node of nodes) {
    if (node.next && !nodeIds.has(node.next)) {
      errors.push(`Node "${node.id}" references non-existent next node: "${node.next}"`);
    }
    if (node.config?.true_next && !nodeIds.has(node.config.true_next)) {
      errors.push(`Node "${node.id}" (condition) references non-existent true_next: "${node.config.true_next}"`);
    }
    if (node.config?.false_next && !nodeIds.has(node.config.false_next)) {
      errors.push(`Node "${node.id}" (condition) references non-existent false_next: "${node.config.false_next}"`);
    }
  }

  // Exactly one trigger node
  const triggers = nodes.filter(n => n.type?.startsWith('trigger_'));
  if (triggers.length === 0) {
    errors.push('Workflow must have exactly one trigger node.');
  }
  if (triggers.length > 1) {
    errors.push(`Workflow has ${triggers.length} trigger nodes. Only one is allowed.`);
  }

  // startNode must reference a valid node
  if (definition.startNode && !nodeIds.has(definition.startNode)) {
    errors.push(`startNode "${definition.startNode}" references a non-existent node.`);
  }

  // Check reachability from startNode (simple BFS)
  if (definition.startNode && nodeIds.has(definition.startNode) && errors.length === 0) {
    const visited = new Set<string>();
    const queue = [definition.startNode];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const node = nodes.find(n => n.id === current);
      if (!node) continue;
      if (node.next) queue.push(node.next);
      if (node.config?.true_next) queue.push(node.config.true_next);
      if (node.config?.false_next) queue.push(node.config.false_next);
    }
    const unreachable = nodes.filter(n => !visited.has(n.id) && !n.type?.startsWith('trigger_'));
    if (unreachable.length > 0) {
      warnings.push(`${unreachable.length} node(s) are unreachable from the start node: ${unreachable.map(n => n.id).join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
