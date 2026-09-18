import { z } from 'zod';
import { ToolDefinition } from '../ai/provider';

export interface ToolContext {
  workspaceId: string;
  userId: string;
  runId: string;
}

export abstract class Tool {
  abstract name: string;
  abstract description: string;
  abstract schema: z.ZodType<any>;

  get definition(): ToolDefinition {
    // Convert Zod schema to basic JSON schema
    // For V0.2, a simple manual mapping or specialized zod-to-json-schema is needed.
    // For brevity, we implement a simple mapping for string/object.
    // In production, `zod-to-json-schema` should be used.
    
    // Fallback simple schema generation for V0.2 demo
    const jsonSchema = {
      type: "object",
      properties: {} as any,
      required: [] as string[]
    };

    if (this.schema instanceof z.ZodObject) {
      const shape = this.schema.shape;
      for (const key in shape) {
        jsonSchema.properties[key] = { type: "string", description: shape[key].description };
        if (!shape[key].isOptional()) {
          jsonSchema.required.push(key);
        }
      }
    }

    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: jsonSchema
      }
    };
  }

  abstract execute(args: any, context: ToolContext): Promise<any>;
}
