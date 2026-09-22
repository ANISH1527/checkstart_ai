import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Cpu, ArrowRight, BarChart3, Search } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-wide">StartupAI</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Assisted Preliminary Startup Validation Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl leading-tight">
          Validate Your Startup Idea <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            With Explainable AI & Evidence
          </span>
        </h1>

        <p className="mt-6 text-slate-400 text-base sm:text-lg max-w-2xl font-medium leading-relaxed">
          Analyze market demand, evaluate problem-solution fit, detect critical information gaps, and get actionable next steps before building.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition-all"
          >
            <span>Start Free Validation</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-base border border-slate-800 transition-colors"
          >
            Explore Dashboard
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">9-Parameter Weighted Scoring</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Deterministic calculations evaluating Market Demand, Problem-Solution Fit, Customer Clarity, Feasibility, and Risk.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Semantic Similarity Search</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Sentence Transformers cosine vector search to detect existing market solutions and high similarity overlap.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Iterative Version History</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Improve your concept over time and track score improvements across version iterations with audit logs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-400">
        <p>AI-Assisted Startup Idea Validation and Recommendation System • Preliminary Decision-Support Assessment</p>
      </footer>
    </div>
  );
};
