import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
        <h2 className="text-2xl font-semibold text-slate-700">Page not found</h2>
        <p className="text-slate-500">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="pt-6">
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto font-bold bg-[#0057FF] hover:bg-[#004DE6] text-white">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
