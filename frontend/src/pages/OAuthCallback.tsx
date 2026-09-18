import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const provider = localStorage.getItem('dovia_oauth_provider');
    const workspaceId = localStorage.getItem('dovia_workspace_id');

    if (!code || !state) {
      setError('Missing authorization code or state.');
      return;
    }
    
    if (!provider) {
      setError('Unknown provider for callback.');
      return;
    }

    api.post(`/connections/${provider}/callback`, { code, state }, { headers: { 'x-workspace-id': workspaceId } })
      .then(() => {
        localStorage.removeItem('dovia_oauth_provider');
        navigate('/settings');
      })
      .catch(err => {
        setError(err.response?.data?.error || err.message || 'Authorization failed.');
      });
      
  }, [navigate, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      {error ? (
        <div className="text-destructive font-medium text-center">
          <p>Authorization Error</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <button onClick={() => navigate('/settings')} className="mt-4 px-4 py-2 border rounded hover:bg-muted">Return to Settings</button>
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Completing authorization...</p>
        </div>
      )}
    </div>
  );
}
