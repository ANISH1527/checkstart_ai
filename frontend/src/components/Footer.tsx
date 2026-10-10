import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                AI Validate
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              An AI-powered startup validation platform designed for college students to evaluate, stress-test, and improve early-stage ideas.
            </p>
          </div>

          {/* Col 2: Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/validate" className="hover:text-white transition">Validate Idea</Link></li>
              <li><a href="#features" className="hover:text-white transition">7-Factor Evaluation</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
              <li><Link to="/dashboard" className="hover:text-white transition">Student Dashboard</Link></li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#about" className="hover:text-white transition">About the Project</a></li>
              <li><span className="text-slate-500 cursor-not-allowed">Student Startup Playbook</span></li>
              <li><span className="text-slate-500 cursor-not-allowed">Y Combinator Prep</span></li>
              <li><span className="text-slate-500 cursor-not-allowed">Campus Incubators</span></li>
            </ul>
          </div>

          {/* Col 4: Legal & Notice */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Disclaimer
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-generated validation is an early-stage assessment tool and should be supplemented with real customer interviews and empirical testing.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AI Validate Platform. Built for Student Entrepreneurs.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for collegiate innovation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
