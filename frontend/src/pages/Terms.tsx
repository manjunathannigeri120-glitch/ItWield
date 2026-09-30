import { Link } from 'react-router-dom';

export function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 py-4 px-6 fixed top-0 w-full z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tight text-indigo-600 hover:text-indigo-700 transition-colors">
            ItWield<span className="text-slate-900">.</span>
          </Link>
          <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            &larr; Back to ItWield
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6">
        <div className="max-w-4xl mx-auto bg-white p-10 md:p-16 rounded-3xl shadow-xl border border-slate-100">
          <h1 className="text-4xl font-extrabold mb-4">ItWield Terms &amp; Conditions</h1>
          <p className="text-slate-500 font-medium mb-12">Last Updated: September 29, 2026</p>

          <div className="space-y-12 text-slate-700 leading-relaxed text-lg">
            
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. About ItWield</h2>
              <p>
                ItWield is an AI-powered business operating platform that can help a founder or authorized business user understand company context, define business objectives, coordinate AI executives and workers, connect authorized external systems, execute permitted actions, monitor results, verify outcomes, and continuously operate within configured authority and safety controls.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Acceptance of These Terms</h2>
              <p>
                By creating an account, connecting an external provider, or configuring a workspace, you agree to these Terms. If you do not agree, you may not use ItWield.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Eligibility</h2>
              <p>
                You must be at least the age of legal majority in your jurisdiction to create an account. You must be legally authorized to bind the company or business entity you are representing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Account Registration</h2>
              <p>
                You must provide accurate information when creating an account. You are responsible for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Workspace and Company Accounts</h2>
              <p>
                Workspaces are strictly isolated. A user from Workspace A cannot execute using Workspace B's connection, Company Brain, objective, worker, or authorization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Founder and Administrator Responsibilities</h2>
              <p>
                Founders remain the ultimate authority. The frontend is never the authority for destructive operations; every action is authorized server-side.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Company Information and Company Brain</h2>
              <p>
                ItWield stores facts, goals, decisions, and strategies in the Company Brain to maintain continuity. This information is derived from your inputs and verified external actions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Business Objectives and Instructions</h2>
              <p>
                You provide the business objectives. ItWield does NOT guarantee that any particular business objective, revenue target, customer target, growth target, cost reduction, or other business result will be achieved. AI plans are not the same as business results.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. AI Executives and AI Workers</h2>
              <p>
                Depending on configuration, ItWield may generate plans, coordinate AI executives (CEO, COO, CMO, CTO, CFO), assign AI workers, and interact with connected services. AI-generated analysis and decisions can contain errors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Autonomous Operation</h2>
              <p>
                ItWield provides autonomous business operations. However, AUTONOMOUS DOES NOT MEAN UNRESTRICTED. Actions remain subject to permissions, capabilities, authorization, risk controls, connected-system access, approval requirements, platform restrictions, and emergency controls.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Connected Systems and Integrations</h2>
              <p>
                ItWield may connect to third-party services, currently including GitHub, Vercel, Supabase, Google, Slack, and Discord. You authorize the connection and must have authority to connect it. Third-party services have independent terms, privacy policies, availability, rate limits, and technical restrictions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Authorization and Permissions</h2>
              <p>
                ItWield can only act within supported capabilities and granted permissions. Unknown capabilities default safely to restricted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">13. External Actions</h2>
              <p>
                The execution model is: User/company objective → AI planning → authorization → worker execution → Control Layer → connected provider → external action → verification → audit/evidence. We do not promise that every action will succeed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Verification and Reconciliation</h2>
              <p>
                ItWield independently verifies external actions where supported (e.g., checking a created external resource). If an outcome is unknown, ItWield reconciles the uncertain execution before attempting again.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">15. Human Approval and Founder Controls</h2>
              <p>
                You are responsible for reviewing important information, reviewing approval requests, and monitoring business-critical operations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">16. Emergency Pause and Stop</h2>
              <p>
                ItWield includes controls that can pause or stop autonomous operation. PAUSE prevents new autonomous execution according to the platform's control model. STOP halts further autonomous operation according to the platform's shutdown behavior. We do not promise that a provider can instantly undo an action already accepted by an external service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">17. Third-Party Services</h2>
              <p>
                Users must only provide or connect information they are authorized to provide. ItWield is not responsible for a user's unlawful acquisition or submission of third-party information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">18. AI and Generated Content</h2>
              <p>
                The LLM receives authorized business context, but does NOT receive provider secrets. The Control Layer evaluates intended execution strictly against database authorization models.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">19. User Responsibilities</h2>
              <p>
                You are responsible for ensuring that your instructions and connected systems are lawful.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">20. Prohibited Uses</h2>
              <p>
                Users must not use ItWield to access systems without authorization, attack systems, commit fraud, impersonate people, violate privacy rights, send unlawful communications, distribute malware, circumvent access controls, violate third-party terms, or perform illegal activities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">21. Intellectual Property</h2>
              <p>
                All rights to ItWield platform code, architecture, and features are retained by us. You retain rights to your Company Brain data and configurations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">22. User/Company Data</h2>
              <p>
                You grant ItWield a license to process your data for the sole purpose of operating your designated business workspace according to these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">23. Security</h2>
              <p>
                Users must protect their login credentials and authorized access. Do not share credentials with other users unless explicitly supported.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">24. Availability and Service Changes</h2>
              <p>
                We may modify or discontinue features at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">25. Fees and Subscriptions</h2>
              <p>
                If paid plans or subscription services are introduced, applicable pricing, billing, renewal, cancellation, and refund terms will be presented before purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">26. Suspension and Termination</h2>
              <p>
                We may suspend or terminate your account if you violate these Terms or pose a risk to the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">27. Account and Workspace Deletion</h2>
              <p>
                The product supports distinct lifecycle controls: Delete Account, Delete Company/Workspace, Delete Company Data, and Disconnect Integration. Deletion of ItWield data does not automatically remove information held by third-party providers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">28. Disclaimers</h2>
              <p>
                ItWield provides AI-assisted and, where configured, autonomous business operations. We provide the service "AS IS". We disclaim all warranties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">29. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, ItWield is not liable for indirect, incidental, or consequential damages resulting from AI actions or connected integrations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">30. Indemnification</h2>
              <p>
                You agree to indemnify us from claims arising out of your instructions, connected integrations, or breach of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">31. Changes to Terms</h2>
              <p>
                We may update these terms at any time. Continued use constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">32. Governing Law</h2>
              <p>
                Governing law and jurisdiction: [TO BE FINALIZED FOR THE OPERATING LEGAL ENTITY].
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">33. Contact Information</h2>
              <p>
                For legal inquiries, contact: [LEGAL CONTACT EMAIL]
              </p>
            </section>

          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 border-t border-slate-200 bg-white">
        <p>© {new Date().getFullYear()} ItWield. AI to operate your business automatically 24/7.</p>
        <div className="mt-4 flex justify-center space-x-6 text-sm">
          <Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms &amp; Conditions</Link>
          <Link to="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
