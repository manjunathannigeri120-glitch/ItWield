export default function RefundPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-8 py-16 text-slate-700">
      <h1 className="text-3xl font-black mb-6 text-slate-900">Cancellation & Refund Policy</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-2 text-slate-900">1. Cancellations</h2>
          <p>You can cancel your subscription at any time. Upon cancellation, you will retain access to your AI compute credits until the end of your current billing cycle.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-2 text-slate-900">2. Refunds</h2>
          <p>We offer a 7-day money-back guarantee for unused compute credits. If you have consumed more than 10% of your monthly credits, refunds are issued on a pro-rata basis at our discretion.</p>
        </section>
      </div>
    </div>
  );
}
