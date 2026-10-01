import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function LandingFAQ() {
  const { user } = useAuth();
  const ctaDest = user ? "/dashboard" : "/login";

  const faqs = [
    {
      question: "How does the AI Executive team actually work?",
      answer: "You assign a high-level business objective to your AI CEO. The CEO breaks it down into an operational plan and delegates tasks to the AI COO and workers. They execute the tasks (research, email, CRM entry) and report back to you for approval."
    },
    {
      question: "Will the AI take actions without my permission?",
      answer: "No. ItWield operates on an authorization model. You can set the AI to strictly 'Require Approval' for high-risk actions like sending external emails or spending money, while allowing it to autonomously do research and draft documents."
    },
    {
      question: "How are Compute Credits consumed?",
      answer: "Credits are consumed based on the AI's operations. A simple task might consume 1 credit, while a massive parallel research workflow might consume 50. When you run out, your AI executives pause until you upgrade."
    }
  ];

  return (
    <>
      <section className="py-24 sm:py-32 bg-[#F4F7FF] font-sans">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-[40px] md:text-[56px] font-extrabold text-[#111827] leading-[1.1] tracking-tight">
              Got questions?
            </h2>
            <p className="text-xl text-[#4B5563] font-medium mt-4">We've got answers.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-4 relative overflow-hidden bg-white text-center font-sans border-t border-slate-100">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-blue-100 to-pink-100 rounded-full blur-[100px] opacity-70 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-[56px] md:text-[80px] font-extrabold text-[#111827] leading-[1.05] tracking-tight mb-8">
            Ready to scale<br/>your business?
          </h2>
          <p className="text-2xl text-[#4B5563] mb-12 font-medium">Join the founders automating their growth with ItWield.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to={ctaDest} 
              className="inline-flex items-center justify-center font-bold text-lg h-16 bg-[#0057FF] text-white px-10 rounded-full hover:bg-[#004DE6] hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto shadow-[0_8px_24px_rgba(0,87,255,0.3)]"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 font-sans">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-black text-[#111827] tracking-tight">ItWield</div>
            <div className="flex gap-8">
              <Link to="/privacy" className="text-[#4B5563] font-medium hover:text-[#0057FF]">Privacy Policy</Link>
              <Link to="/terms" className="text-[#4B5563] font-medium hover:text-[#0057FF]">Terms of Service</Link>
            </div>
            <div className="text-[#4B5563] font-medium">© 2026 ItWield Inc.</div>
          </div>
        </div>
      </footer>
    </>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <button 
        className="w-full text-left p-8 flex justify-between items-center focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xl font-bold text-[#111827] pr-4">{question}</span>
        <ChevronDown className={`w-6 h-6 text-[#0057FF] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ease-in-out px-8 overflow-hidden ${isOpen ? 'pb-8 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-[#4B5563] text-lg leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}
