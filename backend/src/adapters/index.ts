import { ToolAdapter } from './ToolAdapter';
import { GitHubAdapter } from './GitHubAdapter';
import { VercelAdapter } from './VercelAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';

export const adapters: Record<string, ToolAdapter> = {
    github: new GitHubAdapter(),
    vercel: new VercelAdapter(),
    supabase: new SupabaseAdapter()
};

export function getAdapter(provider: string): ToolAdapter | undefined {
    return adapters[provider];
}
