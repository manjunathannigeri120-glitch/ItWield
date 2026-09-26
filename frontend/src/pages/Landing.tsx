import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
          Tell ItWield what you want your business to achieve.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10">
          ItWield's AI CEO, COO, executives and workforce turn business goals into real work, execute within your rules, measure the results and adapt when the plan isn't working.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to={user ? "/dashboard" : "/login"}
            className="inline-flex items-center justify-center font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Start for free
          </Link>
          <a 
            href="#how-it-works"
            className="inline-flex items-center justify-center font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 border border-input text-slate-700 px-8 py-6 text-lg rounded-full bg-white hover:bg-slate-50 transition-all"
          >
            How it works
          </a>
        </div>

        <div className="mt-16 mb-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
          Example Outcomes
        </div>
        <div className="flex flex-wrap justify-center gap-3 mb-20 max-w-3xl mx-auto">
          {["Get me 20 customers.", "Get 100 qualified leads.", "Double my revenue.", "Find what's stopping my business from growing."].map((goal, i) => (
            <div key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-700 font-medium shadow-sm">
              "{goal}"
            </div>
          ))}
        </div>

        <div id="how-it-works" className="grid md:grid-cols-3 gap-8 text-left border-t border-slate-200 pt-16">
          <div>
            <div className="bg-indigo-100 text-indigo-700 w-10 h-10 flex items-center justify-center rounded-lg font-bold mb-4">1</div>
            <h3 className="font-bold text-slate-900 mb-2 text-lg">Tell ItWield your goal</h3>
            <p className="text-sm text-slate-600 leading-relaxed">Connect your business data. ItWield builds the plan and AI executives coordinate the work.</p>
          </div>
          <div>
            <div className="bg-amber-100 text-amber-700 w-10 h-10 flex items-center justify-center rounded-lg font-bold mb-4">2</div>
            <h3 className="font-bold text-slate-900 mb-2 text-lg">You approve sensitive actions</h3>
            <p className="text-sm text-slate-600 leading-relaxed">The AI prepares the work but respects your authority. Execute authorized tasks automatically, review the rest.</p>
          </div>
          <div>
            <div className="bg-emerald-100 text-emerald-700 w-10 h-10 flex items-center justify-center rounded-lg font-bold mb-4">3</div>
            <h3 className="font-bold text-slate-900 mb-2 text-lg">Measure real outcomes</h3>
            <p className="text-sm text-slate-600 leading-relaxed">ItWield tracks actual business metrics, measures the outcome, and adapts when necessary. No fabricated numbers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
