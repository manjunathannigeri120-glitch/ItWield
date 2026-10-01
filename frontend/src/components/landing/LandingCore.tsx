import React from 'react';
import { Bot, Target, ShieldCheck, Zap, ArrowRight, MessageSquare, Briefcase, BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingCore() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-[#F4F7FF] font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-[40px] md:text-[56px] font-extrabold text-[#111827] leading-[1.1] tracking-tight mb-6">
            Everything you need to automate your growth.
          </h2>
          <p className="text-xl text-[#4B5563] font-medium">
            Stop doing manual work. Let your AI executives manage the workflows, talk to leads, and drive revenue.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          
          {/* Feature Block 1 */}
          <div className="bg-white rounded-[32px] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-shadow duration-500">
            <div className="flex-1 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Target className="w-8 h-8 text-[#0057FF]" />
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight">Set business goals.<br/>AI executes them.</h3>
              <p className="text-lg text-[#4B5563] leading-relaxed">
                Just tell ItWield what you want to achieve. Your AI CEO and COO will automatically break it down into tasks and delegate them to AI workers.
              </p>
              <ul className="space-y-4 pt-4">
                <li className="flex items-center gap-3 font-bold text-[#111827]">
                  <div className="w-6 h-6 rounded-full bg-[#0057FF] flex items-center justify-center text-white"><Zap className="w-3 h-3" /></div>
                  Instant task generation
                </li>
                <li className="flex items-center gap-3 font-bold text-[#111827]">
                  <div className="w-6 h-6 rounded-full bg-[#0057FF] flex items-center justify-center text-white"><Zap className="w-3 h-3" /></div>
                  Continuous execution
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full bg-[#F4F7FF] rounded-[24px] p-8 border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold">CEO</div>
                <div>
                  <p className="font-bold text-sm text-slate-800">"Increase Q4 Leads by 20%"</p>
                  <p className="text-xs text-slate-500 mt-1">Delegating to Marketing Agent...</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-start ml-8">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex-shrink-0 flex items-center justify-center text-pink-600 font-bold">MKT</div>
                <div>
                  <p className="font-bold text-sm text-slate-800">"Launching email outreach campaign."</p>
                  <p className="text-xs text-slate-500 mt-1">Status: Running 24/7</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Block 2 */}
          <div className="bg-white rounded-[32px] p-8 md:p-16 flex flex-col md:flex-row-reverse items-center gap-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-shadow duration-500">
            <div className="flex-1 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight">You hold the keys.<br/>Full authorization.</h3>
              <p className="text-lg text-[#4B5563] leading-relaxed">
                Autonomous doesn't mean out of control. ItWield explicitly pauses to ask for your approval before spending money, sending emails, or changing systems.
              </p>
              <Link to="/dashboard" className="inline-flex font-bold text-[#0057FF] hover:text-[#004DE6] text-lg items-center mt-4">
                Explore risk controls <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
            <div className="flex-1 w-full bg-[#F4F7FF] rounded-[24px] p-8 border border-slate-100 flex flex-col items-center justify-center relative">
               <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-slate-100">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                     <ShieldCheck className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="font-bold text-slate-800">Approval Required</p>
                     <p className="text-sm text-slate-500">Send 5,000 emails?</p>
                   </div>
                 </div>
                 <div className="flex gap-3">
                   <button className="flex-1 py-3 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">Reject</button>
                   <button className="flex-1 py-3 rounded-full bg-[#0057FF] text-white font-bold hover:bg-[#004DE6] transition-colors shadow-lg shadow-blue-500/20">Approve</button>
                 </div>
               </div>
            </div>
          </div>

          {/* Grid Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="bg-white rounded-[32px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7 text-[#0057FF]" />
              </div>
              <h4 className="text-xl font-extrabold text-[#111827] mb-3">CRM Integration</h4>
              <p className="text-[#4B5563] leading-relaxed">Automatically qualify leads and sync them directly into your existing CRM tools.</p>
            </div>
            <div className="bg-white rounded-[32px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center mb-6">
                <Briefcase className="w-7 h-7 text-pink-500" />
              </div>
              <h4 className="text-xl font-extrabold text-[#111827] mb-3">Company Brain</h4>
              <p className="text-[#4B5563] leading-relaxed">The AI securely learns your brand voice, operational rules, and product knowledge.</p>
            </div>
            <div className="bg-white rounded-[32px] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center mb-6">
                <BarChart className="w-7 h-7 text-yellow-500" />
              </div>
              <h4 className="text-xl font-extrabold text-[#111827] mb-3">Continuous CI/CD</h4>
              <p className="text-[#4B5563] leading-relaxed">Your AI team learns from mistakes and updates its own logic to never fail twice.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
