import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, LogOut, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function Account() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [nameInput, setNameInput] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  useEffect(() => {
    if (profile?.name) {
      setNameInput(profile.name);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (newName: string) => {
      await api.put('/auth/me', { name: newName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/auth/me');
        await supabase.auth.signOut();
        navigate('/login');
      } catch (err) {
        console.error('Error deleting account:', err);
        alert('Failed to delete account. Please try again or contact support.');
      }
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Account</h1>
        <p className="text-slate-500 mt-2">Manage your personal account settings and security.</p>
      </div>

      <Card className="border-2 border-slate-900 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#0057FF]" />
            Profile Details
          </CardTitle>
          <CardDescription>Your personal information and session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Display Name</label>
            <div className="flex gap-3 mt-1">
              <Input 
                value={nameInput} 
                onChange={e => setNameInput(e.target.value)}
                placeholder="Enter your beloved name..." 
                className="max-w-sm"
              />
              <Button 
                onClick={() => updateProfileMutation.mutate(nameInput)}
                disabled={updateProfileMutation.isPending || nameInput === profile?.name}
              >
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t space-y-1">
            <p className="text-sm font-medium text-slate-700 mb-1">Email Address (Gmail)</p>
            <p className="text-lg font-semibold text-slate-900">{user?.email}</p>
          </div>
          
          <div className="pt-4 border-t">
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-red-900 shadow-md bg-red-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600/80">
            Irreversible and destructive actions for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border border-red-200 bg-white rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-900">Delete Account</h4>
              <p className="text-sm text-slate-500 mt-1">Permanently remove your personal account and all data.</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete Account Permanently
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
