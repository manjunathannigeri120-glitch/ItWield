import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAdminUsers, updateAdminCredits, deleteAdminUser } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Shield, Trash2, Coins, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  totalCredits: number;
}

export function SuperAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creditAmount, setCreditAmount] = useState('1000');
  
  const SUPERADMIN_EMAIL = 'manjunathannigeri120@gmail.com';

  // Strict Frontend Guard
  if (!user?.email || !user.email.toLowerCase().includes('manjunathannigeri120')) {
    return <Navigate to="/not-found" replace />;
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddCredits = async (userId: string) => {
    try {
      await updateAdminCredits(userId, parseInt(creditAmount), 'add');
      loadUsers(); // Refresh
      alert('Credits added successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to add credits');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you absolutely sure? This will permanently delete the user and all their workspaces.')) return;
    
    try {
      await deleteAdminUser(userId);
      loadUsers(); // Refresh
      alert('User deleted successfully');
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
          <p className="text-slate-500">SuperAdmin Control Panel</p>
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
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3">Credits</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                        {u.email}
                        {u.email === SUPERADMIN_EMAIL && (
                          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">YOU</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-mono font-bold">{u.totalCredits}</td>
                      <td className="px-6 py-4 flex gap-4">
                        <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden">
                          <input 
                            type="number" 
                            className="w-20 px-2 py-1 text-sm bg-transparent border-none focus:ring-0" 
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                          />
                          <button 
                            onClick={() => handleAddCredits(u.id)}
                            className="px-3 py-1 bg-green-500 text-white hover:bg-green-600 flex items-center gap-1 transition-colors"
                          >
                            <Coins className="w-4 h-4" /> Add
                          </button>
                        </div>
                        {u.email !== SUPERADMIN_EMAIL && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Ban / Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



