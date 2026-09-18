import { describe, it, expect, vi } from 'vitest';
import { TransformDataAction } from '../workflows/actions/TransformDataAction';
import { SendEmailAction } from '../workflows/actions/SendEmailAction';
import { StoreDataAction } from '../workflows/actions/StoreDataAction';

describe('TransformDataAction', () => {
  it('should uppercase field', async () => {
    const action = new TransformDataAction();
    const result = await action.execute({
      input: { name: 'john' },
      operations: [{ type: 'uppercase', field: 'name' }]
    }, {} as any);
    expect(result.success).toBe(true);
    expect(result.transformed.name).toBe('JOHN');
  });

  it('should add numbers', async () => {
    const action = new TransformDataAction();
    const result = await action.execute({
      input: { score: 10 },
      operations: [{ type: 'add', field: 'score', value: 5 }]
    }, {} as any);
    expect(result.success).toBe(true);
    expect(result.transformed.score).toBe(15);
  });

  it('should pick fields', async () => {
    const action = new TransformDataAction();
    const result = await action.execute({
      input: { a: 1, b: 2, c: 3 },
      operations: [{ type: 'pick', fields: ['a', 'c'] }]
    }, {} as any);
    expect(result.success).toBe(true);
    expect(result.transformed.a).toBe(1);
    expect(result.transformed.c).toBe(3);
    expect(result.transformed.b).toBeUndefined();
  });

  it('should rename field', async () => {
    const action = new TransformDataAction();
    const result = await action.execute({
      input: { oldKey: 'val' },
      operations: [{ type: 'rename', field: 'oldKey', newField: 'newKey' }]
    }, {} as any);
    expect(result.success).toBe(true);
    expect(result.transformed.newKey).toBe('val');
    expect(result.transformed.oldKey).toBeUndefined();
  });

  it('should remove field', async () => {
    const action = new TransformDataAction();
    const result = await action.execute({
      input: { a: 1, b: 2 },
      operations: [{ type: 'remove', field: 'a' }]
    }, {} as any);
    expect(result.success).toBe(true);
    expect(result.transformed.a).toBeUndefined();
    expect(result.transformed.b).toBe(2);
  });

  it('should convert to number', async () => {
    const action = new TransformDataAction();
    const result = await action.execute({
      input: { strNum: '42' },
      operations: [{ type: 'to_number', field: 'strNum' }]
    }, {} as any);
    expect(result.success).toBe(true);
    expect(result.transformed.strNum).toBe(42);
  });

  it('should lowercase field', async () => {
    const action = new TransformDataAction();
    const result = await action.execute({
      input: { name: 'JOHN' },
      operations: [{ type: 'lowercase', field: 'name' }]
    }, {} as any);
    expect(result.success).toBe(true);
    expect(result.transformed.name).toBe('john');
  });

  it('should handle malformed input', async () => {
    const action = new TransformDataAction();
    await expect(action.execute({}, {} as any)).rejects.toThrow('Missing required field');
  });

  it('should reject eval/unknown operation securely', async () => {
    const action = new TransformDataAction();
    const result = await action.execute({
      input: { a: 1 },
      operations: [{ type: 'eval', code: 'console.log(1)' }]
    }, {} as any);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('INVALID_TRANSFORM');
  });
});

describe('SendEmailAction', () => {
  it('should mock email if no api key', async () => {
    const action = new SendEmailAction();
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    const result = await action.execute({
      to: 'test@example.com',
      subject: 'Hello',
      text: 'World'
    }, {} as any);
    
    expect(result.success).toBe(true);
    expect(result.mock).toBe(true);
    
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  });

  it('should fail on missing fields', async () => {
    const action = new SendEmailAction();
    await expect(action.execute({}, {} as any)).rejects.toThrow('Missing required email fields');
  });
});

describe('StoreDataAction', () => {
  it('should fail without supabase client', async () => {
    const action = new StoreDataAction();
    await expect(action.execute({ collection: 'users', data: { a: 1 } }, { supabase: null } as any)).rejects.toThrow('StoreDataAction requires a database connection');
  });

  it('should call supabase insert', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '123', collection_key: 'users' }, error: null })
    };

    const action = new StoreDataAction();
    const result = await action.execute({ collection: 'users', data: { name: 'John' } }, { supabase: mockSupabase as any, workspaceId: 'ws-1' } as any);
    
    expect(result.success).toBe(true);
    expect(result.recordId).toBe('123');
    expect(mockSupabase.from).toHaveBeenCalledWith('workspace_data');
  });
});

import { ActionRegistry } from '../workflows/actions/ActionRegistry';

describe('ActionRegistry', () => {
  it('should resolve SendEmailAction', () => {
    ActionRegistry.register(new SendEmailAction());
    expect(ActionRegistry.get('action_send_email')).toBeDefined();
  });
  
  it('should resolve StoreDataAction', () => {
    ActionRegistry.register(new StoreDataAction());
    expect(ActionRegistry.get('action_store_data')).toBeDefined();
  });
  
  it('should resolve TransformDataAction', () => {
    ActionRegistry.register(new TransformDataAction());
    expect(ActionRegistry.get('action_transform_data')).toBeDefined();
  });
});
