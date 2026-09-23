import { Action, ActionContext } from './Action';

export class TransformDataAction implements Action {
  id = 'DATA_TRANSFORMATION';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { input, operations } = config;
    if (!input) throw new Error('Missing required field (input)');
    if (!operations || !Array.isArray(operations)) {
      throw new Error('Operations must be an array');
    }

    let data: any = input;
    if (typeof input === 'string') {
      try {
        data = JSON.parse(input);
      } catch (err) {
        // If it fails to parse, leave it as string
      }
    } else {
      data = JSON.parse(JSON.stringify(input));
    }

    for (const op of operations) {
      if (!op || !op.type) throw new Error('Invalid operation: missing type');
      
      try {
        if (op.type === 'uppercase') {
          if (op.field && typeof data === 'object') data[op.field] = String(data[op.field] || '').toUpperCase();
          else if (typeof data === 'string') data = data.toUpperCase();
        } 
        else if (op.type === 'lowercase') {
          if (op.field && typeof data === 'object') data[op.field] = String(data[op.field] || '').toLowerCase();
          else if (typeof data === 'string') data = data.toLowerCase();
        }
        else if (op.type === 'trim') {
          if (op.field && typeof data === 'object') data[op.field] = String(data[op.field] || '').trim();
          else if (typeof data === 'string') data = data.trim();
        }
        else if (op.type === 'to_number') {
          if (op.field && typeof data === 'object') data[op.field] = Number(data[op.field]);
          else data = Number(data);
          if (isNaN(op.field && typeof data === 'object' ? data[op.field] : data)) throw new Error('Cannot convert to number');
        }
        else if (op.type === 'to_string') {
          if (op.field && typeof data === 'object') data[op.field] = String(data[op.field]);
          else data = String(data);
        }
        else if (op.type === 'to_boolean') {
          if (op.field && typeof data === 'object') data[op.field] = Boolean(data[op.field]);
          else data = Boolean(data);
        }
        else if (op.type === 'pick') {
          if (typeof data !== 'object') throw new Error('Cannot pick from non-object');
          if (!op.fields || !Array.isArray(op.fields)) throw new Error('pick requires array of fields');
          const picked: any = {};
          for (const f of op.fields) {
            if (f in data) picked[f] = data[f];
          }
          data = picked;
        }
        else if (op.type === 'rename') {
          if (typeof data !== 'object') throw new Error('Cannot rename on non-object');
          if (!op.field || !op.newField) throw new Error('rename requires field and newField');
          if (op.field in data) {
            data[op.newField] = data[op.field];
            delete data[op.field];
          }
        }
        else if (op.type === 'remove') {
          if (typeof data !== 'object') throw new Error('Cannot remove from non-object');
          if (!op.field) throw new Error('remove requires field');
          delete data[op.field];
        }
        else if (op.type === 'concat') {
          if (op.field && typeof data === 'object') data[op.field] = String(data[op.field] || '') + String(op.value || '');
          else if (typeof data === 'string') data = data + String(op.value || '');
        }
        else if (op.type === 'add') {
          if (op.field && typeof data === 'object') data[op.field] = Number(data[op.field]) + Number(op.value);
          else data = Number(data) + Number(op.value);
        }
        else if (op.type === 'subtract') {
          if (op.field && typeof data === 'object') data[op.field] = Number(data[op.field]) - Number(op.value);
          else data = Number(data) - Number(op.value);
        }
        else if (op.type === 'multiply') {
          if (op.field && typeof data === 'object') data[op.field] = Number(data[op.field]) * Number(op.value);
          else data = Number(data) * Number(op.value);
        }
        else if (op.type === 'divide') {
          const denom = Number(op.value);
          if (denom === 0) throw new Error('Division by zero');
          if (op.field && typeof data === 'object') data[op.field] = Number(data[op.field]) / denom;
          else data = Number(data) / denom;
        }
        else {
          throw new Error(`Unsupported operation: ${op.type}`);
        }
      } catch (err: any) {
        return { success: false, error: { code: 'INVALID_TRANSFORM', message: `Operation ${op.type} failed: ${err.message}` } };
      }
    }
    
    return { success: true, transformed: data };
  }
}
