import { Link } from 'react-router-dom';
import { LogoIcon } from '@/components/ui/LogoIcon';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 text-slate-700">
        
        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <LogoIcon className="w-9 h-9 drop-shadow-sm" />
            <span className="text-2xl font-black text-slate-900 tracking-tight">ITWIELD</span>
          </Link>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-600">Legal Document</span>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Terms and Conditions</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: October 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms & Services</h2>
            <p>
              By accessing, browsing, or using <strong>ItWield</strong> (accessible at <a href="https://itwield.com" className="text-blue-600 underline">https://itwield.com</a>) and all associated AI agents, services, APIs, and software ("Service"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue use immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">2. Description of Platform & Autonomous AI Disclaimer</h2>
            <p>
              ItWield is an autonomous AI company workspace designed to assist businesses, startups, and agencies with operational planning, mission delegation, CRM enrichment, and workflow coordination through specialized digital executives (AI CEO, COO, CMO, CTO) and worker agents.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <p className="font-semibold text-slate-900 uppercase tracking-wider">Crucial Autonomous AI Operational Notice:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Human-in-the-Loop Discretion:</strong> AI agents operate based on user-defined goals, prompts, and permissions. You retain full ownership, responsibility, and discretion over approving, executing, and monitoring all actions taken within your workspace.</li>
                <li><strong>No Warranty on Commercial Results:</strong> While our AI models strive for strategic accuracy, ItWield makes no guarantee of specific financial returns, sales revenue, or commercial outcomes.</li>
                <li><strong>Third-Party Platform Compliance:</strong> When integrating external services (Slack, Discord, Google Sheets, CRMs), you are responsible for maintaining compliance with the applicable third-party terms of service.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">3. Subscriptions, Compute Credits & Payment Processing</h2>
            <p>
              Access to autonomous agent capabilities, workflow compute, and executive replanning requires an active subscription or purchased AI compute credits.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Billing & Currency:</strong> Subscriptions are billed on a recurring monthly or annual basis in supported currencies (USD, INR, EUR, AED).</li>
              <li><strong>Payment Gateway:</strong> All financial transactions and payment method details (Credit Cards, Debit Cards, Net Banking, UPI, and Digital Wallets) are processed securely through <strong>Razorpay</strong>, complying with PCI-DSS standards. We do not store raw card numbers on our servers.</li>
              <li><strong>Credit Metering:</strong> Operations consume compute credits proportionally to AI model complexity and tool usage. If credits reach zero, operations pause until replenished.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">4. User Accounts & Security Responsibilities</h2>
            <p>
              You must provide accurate and complete registration information via Google Single Sign-On (OAuth) or verified email authentication. You are solely responsible for maintaining the confidentiality of your credentials and all activities occurring under your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">5. Acceptable Use & Prohibited Activities</h2>
            <p>You agree not to use ItWield to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Engage in illegal activities, spam, unsolicited commercial mass-messaging, or harassment.</li>
              <li>Attempt prompt injections, reverse-engineering, security exploits, or unauthorized extraction of underlying model weights.</li>
              <li>Deploy agents for fraudulent deceptive practices or infringing intellectual property rights.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, ItWield, its founders, and affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from lost profits, service interruptions, third-party API downtimes, or autonomous decisions made by AI agents.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">7. Governing Law & Contact</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, with exclusive jurisdiction in the courts of <strong>Bengaluru, Karnataka, India</strong>.
            </p>
            <p className="pt-2">
              For any legal or billing inquiries, please contact our team at: <a href="mailto:support@itwield.com" className="text-blue-600 font-semibold underline">support@itwield.com</a>.
            </p>
          </section>

        </div>

        {/* Footer Link */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
          <Link to="/" className="text-blue-600 hover:underline">
            &larr; Return to Homepage
          </Link>
          <div className="flex gap-4 text-slate-400">
            <Link to="/privacy" className="hover:text-slate-600 hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link to="/refund" className="hover:text-slate-600 hover:underline">Refund Policy</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
