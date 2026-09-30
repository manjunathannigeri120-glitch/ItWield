import { Link } from 'react-router-dom';

export function Privacy() {
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
          <h1 className="text-4xl font-extrabold mb-4">ItWield Privacy Policy</h1>
          <p className="text-slate-500 font-medium mb-12">Last Updated: September 29, 2026</p>

          <div className="space-y-12 text-slate-700 leading-relaxed text-lg">
            
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p>
                ItWield is designed to support responsible processing of personal data and is intended to operate in accordance with applicable data-protection requirements. This policy explains what we collect and how we process it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Who This Policy Applies To</h2>
              <p>
                This policy applies to founders, administrators, and authorized business users of the ItWield platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Information We Collect</h2>
              <p>
                We collect information directly from you, automatically through your use of the platform, and from external systems you choose to connect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Account Information</h2>
              <p>
                We collect your email, name, authentication identifiers, and session information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Authentication and Session Information</h2>
              <p>
                We process authentication tokens and session identifiers to secure your access to the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Workspace Information</h2>
              <p>
                We process workspace IDs, workspace membership, roles, and permissions to isolate tenant data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Company Information</h2>
              <p>
                You may provide company name, website, industry, description, target customers, products/services, markets, competitors, goals, and constraints.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Company Brain Information</h2>
              <p>
                We store facts, goals, decisions, strategies, customer context, product context, market context, financial context, technical context, operational context, lessons, failures, assumptions, and inferences to power autonomous AI logic.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Business Goals and Objectives</h2>
              <p>
                We process the business objectives and goals you define for the platform to execute.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Workflow and Task Information</h2>
              <p>
                We collect information about the workflows, tasks, worker assignments, execution status, verification results, and audit metadata generated during operation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">11. AI Executive and Worker Activity</h2>
              <p>
                Interactions and directives issued by the simulated executive loops and AI workers are logged in our database for audit and transparency.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Connected Integration Information</h2>
              <p>
                We store the provider name, connection metadata, capabilities, and authorization metadata for services you integrate (e.g., GitHub, Vercel, Supabase, Google, Slack, Discord).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">13. Credentials and Secrets</h2>
              <p>
                Credentials are handled through secure connection infrastructure. Raw secrets are encrypted at rest and do not appear in normal audit logs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">14. Execution and Audit Information</h2>
              <p>
                We log external execution outcomes and system audit events. Raw credentials are never exposed in these logs.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">15. Technical and Diagnostic Information</h2>
              <p>
                We collect error logs and system telemetry to maintain the reliable operation of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">16. How We Use Information</h2>
              <p>
                We use this information to operate your workspace, authenticate users, enforce isolation, route AI operations, connect authorized integrations, verify actions, and debug failures.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">17. AI/LLM Processing</h2>
              <p>
                AI systems process information necessary to understand company context, interpret business goals, plan work, diagnose problems, coordinate executives, generate recommendations, assist workers, and analyze authorized business information. The LLM receives relevant business context but does NOT receive raw credentials merely because a connection exists. Information sent to external AI providers is subject to the provider's applicable terms and privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">18. Connected Third-Party Services</h2>
              <p>
                If you connect systems, data flows between ItWield and those providers subject to the authority you configure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">19. Data Sharing</h2>
              <p>
                We share data strictly to provide the service. We do not sell your company data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">20. Service Providers</h2>
              <p>
                We share information with infrastructure providers, authentication providers, database/storage providers (e.g., Supabase), AI/LLM providers (e.g., OpenAI, OpenRouter), and connected third-party systems as explicitly authorized by you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">21. Data Security</h2>
              <p>
                We maintain security practices including row-level security (RLS) to enforce tenant isolation and encryption at rest for your integration credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">22. Data Retention</h2>
              <p>
                Retention depends on the relevant data type, operational needs, security requirements, legal obligations, and your configured deletion workflow, subject to applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">23. Data Deletion</h2>
              <p>
                You may trigger a Delete Company Data workflow, which cascades through the Company Brain and operational history.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">24. Account Deletion</h2>
              <p>
                When you delete your account, your active sessions are invalidated, autonomous operations are shut down, and your ItWield database records are wiped.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">25. Data Export</h2>
              <p>
                You can export a JSON snapshot of your Company Brain. This export strictly strips secrets.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">26. Integration Disconnect</h2>
              <p>
                Disconnecting an integration instantly removes ItWield's encrypted credentials for that service, preventing further autonomous interactions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">27. International Processing</h2>
              <p>
                Our infrastructure and AI providers may process data in jurisdictions globally. Your data is transferred and processed where our sub-processors maintain facilities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">28. User/Data Principal Rights</h2>
              <p>
                You may access, correct, or delete your information, or export your Company Brain via the application's Account Settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">29. Children's Data</h2>
              <p>
                ItWield is a B2B business operating platform. We do not knowingly collect information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">30. Cookies and Local Storage</h2>
              <p>
                We use secure cookies and local storage exclusively for authentication, session state, and security routing. We do not use advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">31. Changes to This Policy</h2>
              <p>
                We may modify this policy as the platform evolves. We will post the revised policy here.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">32. Contact Information</h2>
              <p>
                For privacy inquiries, contact: [PRIVACY CONTACT EMAIL]
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
