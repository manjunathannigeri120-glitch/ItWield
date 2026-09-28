import { useState } from 'react';
import { api } from '@/lib/api';
import { MessageSquare, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function FeedbackModal() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('OTHER');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    
    try {
      const activeWorkspaceId = localStorage.getItem('itwield_workspace_id');
      if (!activeWorkspaceId) throw new Error('No active workspace');
      
      await api.post(`/workspaces/${activeWorkspaceId}/feedback`, {
        category,
        message,
        current_path: location.pathname
      });
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setMessage('');
        setCategory('OTHER');
      }, 2000);
    } catch (err) {
      alert('Failed to send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center"
        title="Report a problem or send feedback"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900">Send Feedback</h3>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            
            {done ? (
              <div className="p-8 text-center text-green-600 font-medium">
                Thank you for your feedback!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">What's this regarding?</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value="BUG">I found a bug</option>
                    <option value="CONFUSION">This is confusing</option>
                    <option value="AI_RESULT">The AI gave a bad result</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                  <textarea 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:border-indigo-500 outline-none h-32"
                    placeholder="Tell us what happened..."
                    required
                  />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
                  <button type="submit" disabled={submitting || !message.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">
                    {submitting ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
