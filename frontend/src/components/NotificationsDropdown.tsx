import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const wsRes = await api.get('/workspaces');
        if (wsRes.data && wsRes.data.length > 0) {
          const wsId = wsRes.data[0].id;
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('workspace_id', wsId)
            .order('created_at', { ascending: false })
            .limit(10);
            
          if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
          }
        }
      } catch (e) {
        console.error('Failed to fetch notifications');
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async () => {
    if (unreadCount > 0) {
      setUnreadCount(0);
      try {
        const wsRes = await api.get('/workspaces');
        if (wsRes.data && wsRes.data.length > 0) {
          const wsId = wsRes.data[0].id;
          await supabase.from('notifications').update({ is_read: true }).eq('workspace_id', wsId);
        }
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <Button 
        variant="outline" 
        size="icon" 
        className="relative bg-white shadow-sm hover:bg-slate-50 border-slate-200"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAsRead();
        }}
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                You're all caught up!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-4 ${n.is_read ? 'bg-white' : 'bg-indigo-50/30'}`}>
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">{n.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
