import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ScoreGauge } from '../components/ScoreGauge';
import { StatusBadge } from '../components/StatusBadge';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Target,
  BarChart3,
  DollarSign,
  FileCheck2,
  GraduationCap,
  CheckCircle,
  Lightbulb,
  Cpu,
  Layers,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'AI-Powered Validation',
      desc: 'Instant structured deep-dive analysis powered by state-of-the-art AI models tailored for startup ideation.',
    },
    {
      icon: Layers,
      title: '7-Factor Evaluation',
      desc: 'Rigorous weighted scoring across Market Demand, Problem Severity, Competition, ICP, Innovation, Feasibility, and Revenue.',
    },
    {
      icon: TrendingUp,
      title: 'Market Analysis',
      desc: 'Evaluate total addressable market potential, student demographic adoption, and geographic expansion opportunities.',
    },
    {
      icon: ShieldCheck,
      title: 'Competition Moats',
      desc: 'Identify direct and indirect rivals, incumbent blind spots, and defensible unfair advantages for student founders.',
    },
    {
      icon: Target,
      title: 'Risk Detection',
      desc: 'Surface operational, technological, and customer acquisition risks before spending money on premature development.',
    },
    {
      icon: DollarSign,
      title: 'Revenue Analysis',
      desc: 'Formulate viable pricing strategies, unit economics, freemium tiers, and campus monetization channels.',
    },
    {
      icon: Lightbulb,
      title: 'Actionable Advice',
      desc: 'Receive 3-7 prioritized, student-friendly recommendations to accelerate your path to MVP and initial traction.',
    },
    {
      icon: BarChart3,
      title: 'Validation History',
      desc: 'Track and compare all your startup concepts side-by-side on your founder dashboard with interactive charts.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Enter Your Idea',
      desc: 'Describe your startup concept, problem statement, solution, target student or consumer audience, and business model.',
    },
    {
      number: '02',
      title: 'AI Analyzes It',
      desc: 'Our engine evaluates your input against real-world venture rubrics and market signals across 7 core dimensions.',
    },
    {
      number: '03',
      title: 'Get Validation Score',
      desc: 'Receive an overall 100-point weighted score, categorized from High Risk to Highly Promising with a radar chart.',
    },
    {
      number: '04',
      title: 'Improve & Iterate',
      desc: 'Follow concrete mitigation steps, export your PDF report, refine your concept, or compare ideas side-by-side.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col transition-colors">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Student badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
              <GraduationCap className="w-4 h-4" />
              <span>Built for Student Entrepreneurs & Campus Innovators</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6">
              Validate Your Startup Idea <br className="hidden sm:inline" />
              <span className="text-indigo-600">
                Before You Build It.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
              An AI-powered startup validation platform designed for students to evaluate, improve, and develop their startup ideas with a proven 7-parameter framework.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/validate"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all hover:scale-[1.02]"
              >
                <span>Validate My Idea</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-slate-800 text-base shadow-sm transition"
              >
                How It Works
              </a>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-20" />
            <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8">
              {/* Mockup Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                    Interactive Live Report Demo
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                    SkillMatch AI
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validated • Stanford University CS Hub
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge category="Promising" size="lg" />
                </div>
              </div>

              {/* Mockup Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-center">
                {/* Score Column */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <ScoreGauge score={79} overallScore={7.9} size="md" />
                  <p className="text-xs font-semibold text-slate-600 mt-2">
                    Overall Validation Rating
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Weighted 7-Parameter Synthesis
                  </p>
                </div>

                {/* Parameters Column */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Market Demand (25%)</span>
                    <span className="text-emerald-600 font-bold">8.5/10</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[85%]" />
                  </div>

                  <div className="flex justify-between text-xs font-semibold pt-1">
                    <span className="text-slate-600">Problem Severity (20%)</span>
                    <span className="text-emerald-600 font-bold">8.0/10</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[80%]" />
                  </div>

                  <div className="flex justify-between text-xs font-semibold pt-1">
                    <span className="text-slate-600">Competition Advantage (15%)</span>
                    <span className="text-blue-600 font-bold">6.0/10</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full w-[60%]" />
                  </div>
                </div>

                {/* AI Insight Column */}
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Executive Verdict</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    "The startup addresses a significant problem among students and has strong revenue potential, but competition requires a stronger differentiation strategy."
                  </p>
                  <div className="pt-2">
                    <span className="inline-block px-2 py-1 rounded bg-indigo-600 text-white font-semibold text-[11px]">
                      Action: Proceed with MVP Validation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Students Need This Section */}
      <section className="py-16 bg-white border-y border-slate-200 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                The Collegiate Dilemma
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-2 mb-4">
                Why Student Founders Need Structured AI Validation
              </h2>
              <blockquote className="text-lg text-slate-600 italic border-l-4 border-indigo-600 pl-4 mb-6">
                "Students often have startup ideas but lack access to structured market research, business analysis, and expert guidance."
              </blockquote>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Many brilliant collegiate ideas fail not because of poor coding skills, but because founders jump into months of development without stress-testing problem severity, customer willingness to pay, or market saturation. AI Validate serves as your 24/7 venture analyst.
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    Eliminate guesswork with a calibrated 7-parameter scoring algorithm.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    Get student-specific unit economics and campus launch strategies.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">
                    Export high-res PDF validation reports to present to mentors and campus incubators.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                <span className="text-3xl font-extrabold text-indigo-600">7</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  Core Dimensions
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Weighted evaluation from Market Demand (25%) to Feasibility (10%).
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                <span className="text-3xl font-extrabold text-emerald-600">100%</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  Objective Scoring
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Backend-calculated weighted metrics ensure strict mathematical consistency.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                <span className="text-3xl font-extrabold text-blue-600">&lt; 30s</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  Rapid Analysis
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Receive a complete multi-section venture report in seconds.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                <span className="text-3xl font-extrabold text-amber-600">PDF</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  Ready Export
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Download printable executive reports for hackathons & investors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
            Comprehensive Startup Validation Toolkit
          </h2>
          <p className="text-sm text-slate-500 mt-3">
            Every analytical module you need to stress-test your value proposition from concept to launch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-300 group"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-t border-slate-200 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Simple 4-Step Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              From Raw Idea to Validated Venture
            </h2>
            <p className="text-sm text-slate-500 mt-3">
              Four streamlined steps to stress-test your business model before writing a single line of code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Sparkles className="w-10 h-10 text-indigo-200 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Validate Your Startup Idea Today
          </h2>
          <p className="text-base sm:text-lg text-indigo-100 max-w-2xl mx-auto mb-8">
            Join collegiate founders building the next generation of validated, sustainable tech ventures.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold text-base shadow-xl transition hover:scale-105"
          >
            <span>Get Started with Google</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};
