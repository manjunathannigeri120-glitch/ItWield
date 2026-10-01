import React, { useState, useEffect } from 'react';
import { Bot, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-100 py-4' : 'bg-white py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-[#0057FF]" />
            <span className="text-xl font-bold text-[#111827]">ItWield</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF] transition-colors">How it works</a>
            <a href="#features" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF] transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-[#4B5563] hover:text-[#0057FF] transition-colors">Pricing</a>
            <Link 
              to="/dashboard"
              className="inline-flex items-center justify-center font-bold h-10 bg-[#0057FF] text-white px-6 rounded-full hover:bg-[#004DE6] hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_24px_rgba(0,87,255,0.3)] transition-colors shadow-sm"
            >
              Log in
            </Link>
          </div>

          <button 
            aria-label="Toggle Menu"
            className="md:hidden p-2 text-[#4B5563] hover:text-[#0057FF]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-xl">
          <div className="p-4 flex flex-col gap-4">
            <a href="#how-it-works" className="text-sm font-medium text-[#111827] hover:text-[#0057FF]" onClick={() => setIsMobileMenuOpen(false)}>How it works</a>
            <a href="#features" className="text-sm font-medium text-[#111827] hover:text-[#0057FF]" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-sm font-medium text-[#111827] hover:text-[#0057FF]" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
            <Link 
              to="/dashboard"
              className="inline-flex items-center justify-center font-bold h-12 bg-[#0057FF] text-white px-6 rounded-lg w-full"
            >
              Start Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
