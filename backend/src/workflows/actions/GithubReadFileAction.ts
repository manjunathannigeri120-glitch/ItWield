import { Action, ActionContext } from './Action';
import axios from 'axios';
import { decryptObject } from '../../utils/encryption';

export class GithubReadFileAction implements Action {
  id = 'action_github_read_file';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { repo, path, branch = 'main' } = config;
    
    if (!repo || !path) {
      throw new Error('Missing required GitHub fields (repo, path)');
    }

    if (!context.workspaceId || !context.supabase) {
      throw new Error('Missing workspace context for execution');
    }

    const { data: systems, error: sysErr } = await context.supabase
       .from('company_systems')
       .select('*')
       .eq('workspace_id', context.workspaceId)
       .eq('status', 'CONNECTED');

    if (sysErr || !systems || systems.length === 0) {
       return { success: false, error: { message: 'No active connections found for this workspace.' } };
    }

    const githubSys = systems.find(s => s.system_type === 'GITHUB');
    
    if (!githubSys) {
       return { success: false, error: { message: 'GitHub is not connected.' } };
    }

    let credentials: any = {};
    try {
       credentials = decryptObject(githubSys.connection_id);
    } catch (e) {
       return { success: false, error: { message: 'Failed to decrypt GitHub credentials.' } };
    }

    const token = credentials.apiKey;
    if (!token) {
      return { success: false, error: { message: 'GitHub API Token is missing from connection.' } };
    }

    try {
      const api = axios.create({
        baseURL: 'https://api.github.com',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const res = await api.get(`/repos/${repo}/contents/${path}?ref=${branch}`);
      
      // Content is base64 encoded by default from GitHub API
      let content = '';
      if (res.data.content) {
         content = Buffer.from(res.data.content, 'base64').toString('utf-8');
      }

      return {
          success: true,
          provider: 'GITHUB',
          action: 'FILE_READ',
          repo,
          path,
          content
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GITHUB_API_ERROR',
          message: error.response?.data?.message || error.message || 'Failed to interact with GitHub API'
        }
      };
    }
  }
}
