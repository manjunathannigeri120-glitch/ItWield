import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/ui/LogoIcon';

export default function Refund() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 text-slate-700">
        
        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon className="w-9 h-9 drop-shadow-sm" />
            <span className="text-2xl font-black text-slate-900 tracking-tight">ITWIELD</span>
          </Link>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-600">Consumer Policy</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Cancellation & Refund Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: October 2026 | Razorpay & Global Gateway Compliant</p>

        <div className="space-y-8 text-sm leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Instant Self-Service Cancellation</h2>
            <p>
              We believe in complete freedom and transparency. You may cancel your <strong>ItWield</strong> subscription at any time with a single click directly from your dashboard under <strong>Plans & Billing</strong> or by contacting our support desk.
            </p>
            <p>
              Upon cancellation, your account will remain active and you will retain full access to all autonomous features and remaining compute credits until the conclusion of your current prepaid billing period. You will never be billed again after canceling.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. 7-Day Money-Back Guarantee</h2>
            <p>
              We stand firmly behind the quality of our autonomous AI platform. We offer a **7-Day Money-Back Guarantee** for all first-time subscription purchases under the following fair-use terms:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Eligible Window:</strong> Refund requests must be submitted within 7 calendar days of your initial purchase date.</li>
              <li><strong>Compute Consumption:</strong> Full refunds are provided if less than 20% of the allocated monthly compute credits have been consumed. If substantial compute (LLM tokens) has been utilized, a pro-rata refund may be calculated to cover underlying infrastructure costs.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Processing Timeframes & Methods</h2>
            <p>
              Approved refunds are credited automatically back to the original source payment method (UPI account, Credit/Debit Card, or Net Banking) through our payment partner, <strong>Razorpay</strong>.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <p className="font-semibold text-slate-900 mb-1">Standard Processing Window:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>UPI & Net Banking (India):</strong> 2 to 5 business days.</li>
                <li><strong>Credit & Debit Cards (Global):</strong> 5 to 7 business days depending on your card issuer.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. How to Request a Refund</h2>
            <p>
              To initiate a refund, please send an email to <a href="mailto:support@itwield.com" className="text-blue-600 font-semibold underline">support@itwield.com</a> with the subject line <code>"Refund Request - [Your Account Email]"</code>. Our support team responds within 24 hours.
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
            <Link to="/privacy" className="hover:text-slate-600 hover:underline">Privacy Policy</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
