import { describe, test, expect, beforeEach } from 'vitest';
import { TransformDataAction } from '../workflows/actions/TransformDataAction';

describe('Data Transformation Orchestration', () => {
    let action: TransformDataAction;

    beforeEach(() => {
        action = new TransformDataAction();
    });

    test('valid DATA_TRANSFORMATION executes', async () => {
        const result = await action.execute({
            input: { id: 1, name: 'a' },
            operations: [{ type: 'uppercase', field: 'name' }]
        }, {} as any);
        console.log("RESULT", result);
        expect(result.success).toBe(true);
        expect(result.transformed.name).toBe('A');
    });

    test('missing input becomes BLOCKED', async () => {
        const result = await action.execute({
            operations: [{ type: 'deduplicate', field: 'email' }]
        }, {} as any);
        expect(result.success).toBe(false);
        expect(result.missing_dependency).toBe(true);
        expect(result.error).toContain('requires source data');
    });

    test('missing operations becomes BLOCKED', async () => {
        const result = await action.execute({
            input: [{ email: 'test@example.com' }]
        }, {} as any);
        expect(result.success).toBe(false);
        expect(result.missing_dependency).toBe(true);
        expect(result.error).toContain('requires operations configuration');
    });

    test('invalid transformation payload does not execute', async () => {
        const result = await action.execute({
            input: [{ email: 'test@example.com' }],
            operations: [{ type: null }] // invalid
        }, {} as any);
        expect(result.success).toBe(false);
        expect(result.missing_dependency).toBeUndefined(); // It just fails normally
    });
});
