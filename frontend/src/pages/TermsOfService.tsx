import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/ui/LogoIcon';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-8 border-b border-slate-100 pb-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <LogoIcon className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">ItWield</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
          <p className="text-slate-500 mt-2">Last updated: October 2026</p>
        </div>

        <div className="prose prose-slate max-w-none">
          <p>
            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the ItWield website and application operated by ItWield ("us", "we", or "our").
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Autonomous AI Disclaimer</h2>
          <p>
            ItWield provides autonomous artificial intelligence agents that may take actions on your behalf, including but not limited to interacting with third-party APIs, sending emails, and executing code. By using ItWield, you acknowledge that:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>You are fully responsible for the actions taken by the AI agents running in your workspace.</li>
            <li>We are not liable for any damages, data loss, or unintended consequences resulting from the autonomous operations of the AI.</li>
            <li>You must ensure that your use of the AI agents complies with the Terms of Service of any third-party platforms the AI interacts with.</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Subscriptions and Compute Credits</h2>
          <p>
            Some parts of the Service are billed on a subscription basis or via pre-purchased AI compute credits. 
            You will be billed in advance on a recurring and periodic basis. If your compute credits are exhausted, autonomous operations will be suspended until credits are replenished.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Accounts</h2>
          <p>
            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">5. Termination</h2>
          <p>
            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">6. Changes</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
