import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  TrendingUp,
  Award,
  Users,
  ShieldCheck,
  Building,
  Target,
  ArrowRight,
  BookOpen,
  DollarSign
} from 'lucide-react';

export const IncubatorGuidelinesPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-bold text-indigo-200 border border-white/10">
            <Compass className="w-3.5 h-3.5" />
            <span>Collegiate Incubation Framework</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Campus Incubator Guidelines & Evaluation Rubric
          </h1>
          <p className="text-sm text-indigo-100 leading-relaxed font-medium">
            Standardized validation protocols and milestone criteria for student founders,
            faculty mentors, and university incubation panels.
          </p>
        </div>
      </div>

      {/* 1. Four Classification Bands */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-dark-border">
          <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-dark-text">
              Validation Scoring & Decision Bands (report_v1)
            </h2>
            <p className="text-xs text-slate-500 dark:text-dark-muted">
              Evaluated across 7 weighted parameters (Market Demand 25%, Problem Severity 20%, Competition 15%, Target Customer 10%, Innovation 10%, Feasibility 10%, Revenue Potential 10%).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                80% - 100%
              </span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Highly Promising
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
              Build MVP and Recruit Beta Users
            </h3>
            <p className="text-xs text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
              Demonstrates verified market demand, clear customer persona, and actionable unit economics. Eligible for university proof-of-concept grants and dedicated mentor assignment.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-600 text-white">
                60% - 79.9%
              </span>
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                Promising
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-blue-950 dark:text-blue-200">
              Conduct 10-15 Customer Interviews
            </h3>
            <p className="text-xs text-blue-800/90 dark:text-blue-300/80 leading-relaxed">
              Viable core value proposition with secondary information gaps in customer willingness to pay or competition moat. Conduct structured founder interviews before building heavy code.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-600 text-white">
                40% - 59.9%
              </span>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Needs Improvement
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
              Execute a Structured Concept Pivot
            </h3>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
              High competitive congestion or vague customer segment (&quot;everyone&quot;). Reframe problem definition and narrow target customer to a specific college beachhead.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-600 text-white">
                0% - 39.9%
              </span>
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                High Risk
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-rose-950 dark:text-rose-200">
              Pause Development &amp; Conduct Exploratory Research
            </h3>
            <p className="text-xs text-rose-800/90 dark:text-rose-300/80 leading-relaxed">
              Critical gaps in problem severity, impossible technical assumptions, or missing revenue signal. Do not invest development time until problem severity is independently proven.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Startup Stage Progression */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-dark-border">
          <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-dark-text">
            Incubation Lifecycle &amp; Stage Gates
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-200/80 dark:border-dark-border">
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Stage 1
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-dark-text mt-1">Idea Formulation</h4>
            <p className="text-xs text-slate-500 dark:text-dark-muted mt-1 leading-relaxed">
              Define the problem statement, primary beneficiary, and unique solution hypothesis.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-200/80 dark:border-dark-border">
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Stage 2
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-dark-text mt-1">Customer Interviews</h4>
            <p className="text-xs text-slate-500 dark:text-dark-muted mt-1 leading-relaxed">
              Validate problem severity with 15 target users without pitching the solution.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-200/80 dark:border-dark-border">
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Stage 3
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-dark-text mt-1">Prototype / MVP</h4>
            <p className="text-xs text-slate-500 dark:text-dark-muted mt-1 leading-relaxed">
              Deploy minimum functional product or landing page testing willingness to pay.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-200/80 dark:border-dark-border">
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Stage 4
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-dark-text mt-1">Campus Pilot</h4>
            <p className="text-xs text-slate-500 dark:text-dark-muted mt-1 leading-relaxed">
              Execute cohort testing with 50+ campus users and collect weekly retention metrics.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
            Ready to validate your startup idea against these guidelines?
          </h3>
          <p className="text-xs text-slate-600 dark:text-dark-muted mt-0.5">
            Run your concept through the automated 15-layer validation pipeline.
          </p>
        </div>
        <Link
          to="/validate"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
        >
          <span>Start Validation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
