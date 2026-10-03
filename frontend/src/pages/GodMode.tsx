import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAdminUsers, updateAdminCredits, deleteAdminUser, banAdminUser, unbanAdminUser } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Shield, Trash2, Loader2, Minus, Plus, AlertCircle } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  totalCredits: number;
  banned_until?: string;
}

export function GodMode() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creditAmount, setCreditAmount] = useState('100');
  
  const SUPERADMIN_EMAIL = 'manjunathannigeri120@gmail.com';

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.email?.toLowerCase().includes('manjunathannigeri120')) {
      loadUsers();
    }
  }, [authLoading, user, loadUsers]);

  if (authLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;

  if (!user?.email || !user.email.toLowerCase().includes('manjunathannigeri120')) {
    return <div className="p-12 text-center text-red-500"><h1>Access Denied! You are not Manjunath.</h1><p>Your email: '{user?.email}'</p></div>;
  }

  const handleUpdateCredits = async (userId: string, isSubtract: boolean) => {
    try {
      let amount = parseInt(creditAmount);
      if (isNaN(amount) || amount <= 0) return alert('Enter a valid number greater than 0');
      if (isSubtract) { amount = -amount; }
      await updateAdminCredits(userId, amount, 'add');
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update credits');
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    if (!isBanned && !window.confirm('Are you sure you want to BAN this user?')) return;
    try {
      if (isBanned) {
        await unbanAdminUser(userId);
      } else {
        await banAdminUser(userId);
      }
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update ban status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you absolutely sure? This will permanently delete the user.')) return;
    try {
      await deleteAdminUser(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-8 border-b border-red-100 pb-4">
        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">God Mode</h1>
          <p className="text-slate-500">SuperAdmin Control Panel v2</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Management ({users.length})</CardTitle>
          <CardDescription>Manage credits and ban accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Remaining Credits</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isBanned = !!u.banned_until;
                    return (
                      <tr key={u.id} className={\g-white border-b hover:bg-slate-50 \\}>
                        <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                          {u.email}
                          {u.email === SUPERADMIN_EMAIL && (
                            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">YOU</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isBanned ? (
                            <span className="text-red-600 font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4"/> BANNED</span>
                          ) : (
                            <span className="text-green-600 font-medium">Active</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold">{u.totalCredits}</td>
                        <td className="px-6 py-4 flex gap-4">
                          <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden">
                            <input 
                              type="number" 
                              className="w-20 px-2 py-1 text-sm bg-transparent border-none focus:ring-0" 
                              value={creditAmount}
                              onChange={(e) => setCreditAmount(e.target.value)}
                            />
                            <button onClick={() => handleUpdateCredits(u.id, true)} className="px-2 py-1 bg-amber-500 text-white hover:bg-amber-600 transition-colors"><Minus className="w-4 h-4" /></button>
                            <button onClick={() => handleUpdateCredits(u.id, false)} className="px-2 py-1 bg-green-500 text-white hover:bg-green-600 transition-colors"><Plus className="w-4 h-4" /></button>
                          </div>
                          {u.email !== SUPERADMIN_EMAIL && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleBanUser(u.id, isBanned)} className={\px-3 py-1 rounded-lg text-xs font-bold transition-colors \\}>
                                {isBanned ? 'UNBAN' : 'BAN'}
                              </button> 
                              <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Permanently Delete User"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
