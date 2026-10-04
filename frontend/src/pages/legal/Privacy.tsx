import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/ui/LogoIcon';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 text-slate-700">
        
        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon className="w-9 h-9 drop-shadow-sm" />
            <span className="text-2xl font-black text-slate-900 tracking-tight">ITWIELD</span>
          </Link>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-600">Privacy & Data Security</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: October 2026 | GDPR, CCPA & DPDP (India) Compliant</p>

        <div className="space-y-8 text-sm leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Commitment to Privacy</h2>
            <p>
              At <strong>ItWield</strong> ("we", "us", "our"), accessible via <a href="https://itwield.com" className="text-blue-600 underline">https://itwield.com</a>, the privacy and security of our users' personal and business data is paramount. This Privacy Policy explains our practices regarding data collection, processing, AI context boundaries, and user rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Credentials:</strong> Email address, name, and profile information provided via Google OAuth or email signup.</li>
              <li><strong>Company & Business Context:</strong> Workspace configuration, company descriptions, target customer personas, business goals, and CRM records you choose to input into the platform.</li>
              <li><strong>Billing Information:</strong> Payment transactions are handled directly through our PCI-DSS compliant partner, <strong>Razorpay</strong>. We do not process or store sensitive payment card numbers on our infrastructure.</li>
              <li><strong>Technical Usage & Analytics:</strong> Aggregated, anonymized telemetry, session duration, and device information via Google Analytics (GA4) to improve system stability.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. How Your Data is Used & AI Isolation</h2>
            <p>
              We process data solely to provide, operate, and maintain your autonomous AI workspace. We adhere to strict data segregation principles:
            </p>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs space-y-2 text-slate-800">
              <p className="font-bold text-blue-900 uppercase tracking-wider">🔒 Strict AI Data Boundary Policy:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li><strong>No Data Selling:</strong> We NEVER sell, rent, or trade your personal or business data to third-party advertisers or data brokers.</li>
                <li><strong>No Model Training on Customer Data:</strong> Customer inputs, business documents, and company memory are processed strictly for live inference and are NOT used to train public AI foundation models.</li>
                <li><strong>Encrypted Connections:</strong> All data transmitted between your browser and our servers is secured using modern TLS 1.3 encryption.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. User Rights & Complete Account Deletion</h2>
            <p>Under international privacy regulations (GDPR, CCPA, and India's DPDP Act), you have the absolute right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Access & Portability:</strong> Request a copy of all personal and workspace data stored in your account.</li>
              <li><strong>Right to Erasure (Permanent Account Deletion):</strong> You can permanently delete your entire account, workspaces, memory records, and profile data instantly at any time via your <strong>Account Settings</strong> (`/account`).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. Contact Our Data Protection Officer</h2>
            <p>
              For privacy questions, data deletion requests, or compliance inquiries, reach out to our team at:  
              <a href="mailto:privacy@itwield.com" className="text-blue-600 font-semibold underline ml-1">privacy@itwield.com</a> or <a href="mailto:support@itwield.com" className="text-blue-600 font-semibold underline ml-1">support@itwield.com</a>.
            </p>
          </section>

        </div>

        {/* Footer Link */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
          <Link to="/" className="text-blue-600 hover:underline">
            &larr; Return to Homepage
          </Link>
          <div className="flex gap-4 text-slate-400">
            <Link to="/terms" className="hover:text-slate-600 hover:underline">Terms of Service</Link>
            <span>•</span>
            <Link to="/refund" className="hover:text-slate-600 hover:underline">Refund Policy</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
