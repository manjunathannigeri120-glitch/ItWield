import React, { useState, useEffect } from 'react';
import { Bot, Menu, X, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' : 'bg-white py-6'
    }`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#0057FF] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-[#111827] tracking-tight">ItWield</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[15px] font-bold text-[#111827] hover:text-[#0057FF] transition-colors flex items-center gap-1">
                Product <ChevronDown className="w-4 h-4 text-slate-400" />
              </a>
              <a href="#how-it-works" className="text-[15px] font-bold text-[#111827] hover:text-[#0057FF] transition-colors">How it works</a>
              <a href="#pricing" className="text-[15px] font-bold text-[#111827] hover:text-[#0057FF] transition-colors">Pricing</a>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/login" className="text-[15px] font-bold text-[#111827] hover:text-[#0057FF] transition-colors">
              Log in
            </Link>
            <Link 
              to="/dashboard"
              className="inline-flex items-center justify-center font-bold h-12 bg-[#0057FF] text-white px-6 rounded-full hover:bg-[#004DE6] hover:-translate-y-0.5 transition-all shadow-md shadow-blue-500/20"
            >
              Get Started Free
            </Link>
          </div>

          <button 
            aria-label="Toggle Menu"
            className="md:hidden p-2 text-slate-600 hover:text-[#0057FF]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-2xl">
          <div className="p-6 flex flex-col gap-6">
            <a href="#features" className="text-lg font-bold text-[#111827]" onClick={() => setIsMobileMenuOpen(false)}>Product</a>
            <a href="#how-it-works" className="text-lg font-bold text-[#111827]" onClick={() => setIsMobileMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="text-lg font-bold text-[#111827]" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
            <hr className="border-slate-100" />
            <Link to="/login" className="text-lg font-bold text-[#111827]" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
            <Link 
              to="/dashboard"
              className="inline-flex items-center justify-center font-bold h-14 bg-[#0057FF] text-white px-6 rounded-full text-lg shadow-lg shadow-blue-500/20"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
