export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto p-8 py-16 text-slate-700">
      <h1 className="text-3xl font-black mb-6 text-slate-900">Privacy Policy</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-2 text-slate-900">1. Data Collection</h2>
          <p>We collect essential data required to run your autonomous AI agents, including workspace configuration, integration keys, and billing information.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-2 text-slate-900">2. Data Security</h2>
          <p>We use industry-standard encryption for all data at rest and in transit. Payment information is handled exclusively by Razorpay and is never stored on our servers.</p>
        </section>
      </div>
    </div>
  );
}
