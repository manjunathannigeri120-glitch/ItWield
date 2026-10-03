export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto p-8 py-16 text-slate-700">
      <h1 className="text-3xl font-black mb-6 text-slate-900">Terms and Conditions</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-2 text-slate-900">1. Introduction</h2>
          <p>Welcome to ItWield. By accessing our website and using our AI OS services, you agree to these terms.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-2 text-slate-900">2. Subscriptions & Payments</h2>
          <p>All payments are securely processed via Razorpay. Subscriptions are billed monthly. You can cancel at any time through your dashboard.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-2 text-slate-900">3. Fair Use & AI Compute</h2>
          <p>AI compute credits are allocated based on your plan. Misuse of the platform or malicious prompt injections may result in account termination.</p>
        </section>
      </div>
    </div>
  );
}
