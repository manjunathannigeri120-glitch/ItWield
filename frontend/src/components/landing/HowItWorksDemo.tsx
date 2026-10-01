import { useState } from 'react';
import { 
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Check,
  Terminal,
  BrainCircuit,
  Users,
  Activity,
  CheckCircle2,
  RefreshCcw,
  Search,
  Zap,
  Target
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const STEPS = [
  { id: 1, name: 'Command', icon: Terminal },
  { id: 2, name: 'Understand', icon: BrainCircuit },
  { id: 3, name: 'Plan', icon: Users },
  { id: 4, name: 'Execute', icon: Activity },
  { id: 5, name: 'Verify', icon: CheckCircle2 },
  { id: 6, name: 'Operate', icon: RefreshCcw }
];

export function HowItWorksDemo() {
  const [activeStep, setActiveStep] = useState(1);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 6));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3 gap-4">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto w-full sm:w-auto scrollbar-hide py-1">
          {STEPS.map((step) => {
            const isActive = step.id === activeStep;
            const isCompleted = step.id < activeStep;
            
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : isCompleted 
                      ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" 
                      : "text-slate-400 hover:bg-slate-200"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 mr-1.5" />
                ) : (
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px] mr-1.5",
                    isActive ? "bg-white/20" : "bg-slate-200 text-slate-400"
                  )}>
                    {step.id}
                   aria-hidden="true">?</span>
                )}
                {step.name}
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <button 
            onClick={prevStep}
            disabled={activeStep === 1}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextStep}
            disabled={activeStep === 6}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 md:p-12 min-h-[500px] flex flex-col justify-center bg-slate-50 relative overflow-hidden">
        {/* Step 1 */}
        <div className={cn("transition-all duration-500 absolute inset-0 p-8 md:p-12 flex flex-col justify-center", activeStep === 1 ? "opacity-100 translate-x-0 z-10" : "opacity-0 -translate-x-8 pointer-events-none")}>
          <div className="max-w-3xl mx-auto w-full text-center">
            <h3 className="text-3xl font-bold text-slate-900 mb-8">You give an outcome</h3>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 max-w-2xl mx-auto transform transition-transform hover:scale-[1.02]">
              <div className="flex items-center space-x-3 mb-4 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">You</div>
                <div className="text-lg font-medium text-slate-800">"Get me 20 new customers."</div>
              </div>
              <div className="text-sm text-slate-400 text-left">
                <p className="font-medium text-slate-700 mb-1">No workflow designer.</p>
                <p className="font-medium text-slate-700 mb-3">No complicated automation setup.</p>
                <p>Tell your AI company what you want in normal language.</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 bg-slate-100 text-slate-400 rounded-full text-sm font-medium">"Find what's stopping my business from growing." aria-hidden="true">?</span>
              <span className="px-4 py-2 bg-slate-100 text-slate-400 rounded-full text-sm font-medium">"Reduce unnecessary costs." aria-hidden="true">?</span>
              <span className="px-4 py-2 bg-slate-100 text-slate-400 rounded-full text-sm font-medium">"Pause customer acquisition." aria-hidden="true">?</span>
            </div>
            
            <button onClick={nextStep} className="mt-12 inline-flex items-center space-x-2 text-indigo-600 font-semibold hover:text-indigo-700">
              <span>Next aria-hidden="true">?</span> <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className={cn("transition-all duration-500 absolute inset-0 p-8 md:p-12 flex flex-col justify-center", activeStep === 2 ? "opacity-100 translate-x-0 z-10" : activeStep < 2 ? "opacity-0 translate-x-8 pointer-events-none" : "opacity-0 -translate-x-8 pointer-events-none")}>
          <div className="max-w-3xl mx-auto w-full text-center">
            <h3 className="text-3xl font-bold text-slate-900 mb-6">ItWield understands your company</h3>
            
            <p className="text-lg text-slate-400 mb-10">ItWield uses the company context you've already provided.</p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1 w-full text-left">
                <div className="flex items-center space-x-2 text-indigo-600 font-bold mb-4">
                  <BrainCircuit className="w-5 h-5" />
                  <span>COMPANY BRAIN aria-hidden="true">?</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm font-medium text-slate-400">
                  <div className="bg-slate-50 px-3 py-2 rounded-lg">Company</div>
                  <div className="bg-slate-50 px-3 py-2 rounded-lg">Products</div>
                  <div className="bg-slate-50 px-3 py-2 rounded-lg">Customers</div>
                  <div className="bg-slate-50 px-3 py-2 rounded-lg">Market</div>
                  <div className="bg-slate-50 px-3 py-2 rounded-lg">Goals</div>
                  <div className="bg-slate-50 px-3 py-2 rounded-lg">Competitors</div>
                </div>
              </div>
              
              <div className="hidden md:flex flex-col items-center animate-pulse">
                <ArrowRight className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="md:hidden flex flex-col items-center animate-pulse">
                <ArrowRight className="w-8 h-8 text-indigo-400 rotate-90" />
              </div>

              <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-md flex-1 w-full">
                <Target className="w-8 h-8 mb-4 mx-auto text-indigo-200" />
                <h4 className="font-bold text-lg mb-2">AI understands objective</h4>
                <p className="text-indigo-100 text-sm">Context is automatically applied to your request.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className={cn("transition-all duration-500 absolute inset-0 p-8 md:p-12 flex flex-col justify-center", activeStep === 3 ? "opacity-100 translate-x-0 z-10" : activeStep < 3 ? "opacity-0 translate-x-8 pointer-events-none" : "opacity-0 -translate-x-8 pointer-events-none")}>
          <div className="max-w-4xl mx-auto w-full text-center">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Your AI executives take ownership</h3>
            <p className="text-lg text-slate-400 mb-8">The appropriate executives coordinate around the objective.</p>

            <div className="flex flex-col items-center relative">
              <div className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow-md z-10">OBJECTIVE</div>
              <div className="w-px h-6 bg-slate-300"></div>
              
              {/* CEO */}
              <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-md w-64 z-10">
                <div className="font-bold text-lg">CEO</div>
                <div className="text-indigo-200 text-xs mt-1">Company strategy & priorities</div>
                <div className="bg-indigo-700 text-xs px-2 py-1 rounded mt-2 inline-block">What matters most?</div>
              </div>
              <div className="w-px h-6 bg-indigo-300"></div>

              {/* COO */}
              <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-md w-64 z-10">
                <div className="font-bold text-lg">COO</div>
                <div className="text-indigo-100 text-xs mt-1">Operations & coordination</div>
                <div className="bg-indigo-600 text-xs px-2 py-1 rounded mt-2 inline-block">How do we operate?</div>
              </div>
              
              <div className="w-px h-6 bg-slate-300"></div>
              
              {/* Branching */}
              <div className="w-full max-w-3xl relative h-10">
                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-slate-300"></div>
                <div className="absolute top-0 left-1/4 w-px h-10 bg-slate-300"></div>
                <div className="absolute top-0 left-1/2 w-px h-10 bg-indigo-400 border-l-2 border-dashed"></div>
                <div className="absolute top-0 right-1/4 w-px h-10 bg-slate-300"></div>
              </div>

              {/* Depts */}
              <div className="flex w-full max-w-3xl justify-between px-4 z-10">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-[30%] opacity-60">
                  <div className="font-bold text-slate-700">CTO</div>
                  <div className="text-slate-400 text-xs mt-1">Technology & systems</div>
                </div>
                <div className="bg-white border-2 border-indigo-400 p-4 rounded-xl shadow-md w-[30%] relative">
                  <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">ACTIVE</div>
                  <div className="font-bold text-indigo-700">CMO</div>
                  <div className="text-slate-400 text-xs mt-1">Customers & growth</div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-[30%] opacity-60">
                  <div className="font-bold text-slate-700">CFO</div>
                  <div className="text-slate-400 text-xs mt-1">Financial health & cost</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className={cn("transition-all duration-500 absolute inset-0 p-8 md:p-12 flex flex-col justify-center", activeStep === 4 ? "opacity-100 translate-x-0 z-10" : activeStep < 4 ? "opacity-0 translate-x-8 pointer-events-none" : "opacity-0 -translate-x-8 pointer-events-none")}>
          <div className="max-w-4xl mx-auto w-full text-center">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">AI workers execute the work</h3>
            <div className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-8">
              INTERACTIVE DEMO — Illustrative activity, not real business results
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-3xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="bg-indigo-100 text-indigo-700 font-bold px-6 py-2 rounded-lg mb-4 border border-indigo-200">
                  CMO WORK ASSIGNMENTS
                </div>
                <ArrowRight className="w-6 h-6 text-slate-300 rotate-90 mb-4" />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                    <Search className="w-5 h-5 mx-auto text-slate-400 mb-2" />
                    <div className="font-semibold text-slate-700 text-sm">Research Worker</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                    <Users className="w-5 h-5 mx-auto text-slate-400 mb-2" />
                    <div className="font-semibold text-slate-700 text-sm">Qualify Worker</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
                    <Zap className="w-5 h-5 mx-auto text-slate-400 mb-2" />
                    <div className="font-semibold text-slate-700 text-sm">Execute Worker</div>
                  </div>
                </div>

                <div className="w-full bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-xl text-left shadow-inner h-32 overflow-hidden flex flex-col justify-end relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none"></div>
                  <div className="space-y-2 relative z-10 animate-[slideUp_4s_ease-in-out_infinite]">
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Market research completed</div>
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Prospects identified</div>
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Opportunities processed</div>
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-500" /> Results recorded in CRM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className={cn("transition-all duration-500 absolute inset-0 p-8 md:p-12 flex flex-col justify-center", activeStep === 5 ? "opacity-100 translate-x-0 z-10" : activeStep < 5 ? "opacity-0 translate-x-8 pointer-events-none" : "opacity-0 -translate-x-8 pointer-events-none")}>
          <div className="max-w-4xl mx-auto w-full text-center">
            <h3 className="text-3xl font-bold text-slate-900 mb-4">ItWield verifies what actually happened</h3>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              AI doesn't get to declare success. ItWield separates planned work, executed work, and verified business outcomes based on real business data.
            </p>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden max-w-2xl mx-auto mb-4">
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                <span className="font-bold text-slate-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-indigo-600" /> OUTCOME VERIFICATION aria-hidden="true">?</span>
                <span className="text-xs bg-slate-200 text-slate-400 px-2 py-1 rounded font-medium">Demo data aria-hidden="true">?</span>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-400 mb-1">Target Customers</div>
                    <div className="text-4xl font-extrabold text-slate-900">20</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-indigo-500 mb-1">Verified Customers</div>
                    <div className="text-5xl font-extrabold text-indigo-600">7</div>
                  </div>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-4 mt-6 mb-2 overflow-hidden flex">
                  <div className="bg-indigo-600 h-4 rounded-full" style={{ width: '35%' }}></div>
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>0 aria-hidden="true">?</span>
                  <span>Remaining: 13 aria-hidden="true">?</span>
                  <span>20 aria-hidden="true">?</span>
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-400">Only supported business records count toward the actual result.</p>
          </div>
        </div>

        {/* Step 6 */}
        <div className={cn("transition-all duration-500 absolute inset-0 p-8 md:p-12 flex flex-col justify-center", activeStep === 6 ? "opacity-100 translate-x-0 z-10" : "opacity-0 translate-x-8 pointer-events-none")}>
          <div className="max-w-4xl mx-auto w-full text-center">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">Your AI company keeps operating</h3>
            <p className="text-lg text-slate-400 mb-8 font-medium">Autonomous doesn't mean uncontrolled.</p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 max-w-3xl mx-auto">
              {/* Loop visual */}
              <div className="relative w-64 h-64 shrink-0">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-dashed"></div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-[spin_8s_linear_infinite]"></div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white m-4 rounded-full shadow-lg z-10 border border-slate-100">
                  <RefreshCcw className="w-8 h-8 text-indigo-600 mb-2" />
                  <span className="font-bold text-slate-900">OPERATE aria-hidden="true">?</span>
                </div>

                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-sm text-slate-700 z-20">Evaluate</div>
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-sm text-slate-700 z-20">Replan</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-sm text-slate-700 z-20">Verify</div>
                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-sm text-slate-700 z-20">Execute</div>
              </div>

              {/* Text explanations */}
              <div className="text-left space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 mr-3 shrink-0"></div>
                  <div><span className="font-semibold text-slate-800">If it's working: aria-hidden="true">?</span> <span className="text-slate-400">Continue aria-hidden="true">?</span></div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3 shrink-0"></div>
                  <div><span className="font-semibold text-slate-800">If it's not working: aria-hidden="true">?</span> <span className="text-slate-400">Investigate & replan aria-hidden="true">?</span></div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 mr-3 shrink-0"></div>
                  <div><span className="font-semibold text-slate-800">If it's blocked: aria-hidden="true">?</span> <span className="text-slate-400">Coordinate the dependency aria-hidden="true">?</span></div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 mr-3 shrink-0"></div>
                  <div><span className="font-semibold text-slate-800">If authority required: aria-hidden="true">?</span> <span className="text-slate-400">Pause & ask you aria-hidden="true">?</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}