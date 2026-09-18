import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIProvider } from '../ai/openaiProvider';
import OpenAI from 'openai';

vi.mock('openai', () => {
  return {
    default: vi.fn()
  };
});

describe('OpenAIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns successful response', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      model: 'gpt-4o-mini',
      choices: [{ message: { content: 'Success response', tool_calls: undefined } }],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
    });

    (OpenAI as any).mockImplementation(function() {
      return {
        chat: { completions: { create: mockCreate } }
      };
    });

    const provider = new OpenAIProvider('key');
    const res = await provider.generateText([{ role: 'user', content: 'hello' }], 'gpt-4o-mini');
    
    expect(res.text).toBe('Success response');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('retries on transient failure (status 429)', async () => {
    let calls = 0;
    const mockCreate = vi.fn().mockImplementation(() => {
      calls++;
      if (calls === 1) {
        throw { status: 429, message: 'Rate limited' };
      }
      return Promise.resolve({
        model: 'gpt-4o-mini',
        choices: [{ message: { content: 'Recovered' } }],
      });
    });

    (OpenAI as any).mockImplementation(function() {
      return {
        chat: { completions: { create: mockCreate } }
      };
    });

    const provider = new OpenAIProvider('key');
    const res = await provider.generateText([], 'gpt-4o-mini');
    
    expect(res.text).toBe('Recovered');
    expect(calls).toBe(2);
  });

  it('fails immediately on non-retryable error (status 400)', async () => {
    const mockCreate = vi.fn().mockRejectedValue({ status: 400, message: 'Bad request' });
    (OpenAI as any).mockImplementation(function() {
      return {
        chat: { completions: { create: mockCreate } }
      };
    });

    const provider = new OpenAIProvider('key');
    await expect(provider.generateText([], 'gpt-4o-mini')).rejects.toThrow('OpenAI API error: Bad request');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
