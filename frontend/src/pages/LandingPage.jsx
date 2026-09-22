import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Rocket, 
  Menu, 
  X, 
  Pencil, 
  Cpu, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Users, 
  Swords, 
  Sparkles, 
  Wrench, 
  DollarSign, 
  Layers, 
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSample = () => {
    const elem = document.getElementById('sample');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const parameters = [
    { name: 'Market Demand', desc: 'Is there a real, growing group of people actively searching for this solution?', icon: TrendingUp },
    { name: 'Problem-Solution Fit', desc: 'Does your proposed product directly solve the pain point you identified?', icon: Target },
    { name: 'Target Customer Clarity', desc: 'Is your customer segment specifically defined or too broad?', icon: Users },
    { name: 'Competition', desc: 'Who else solves this today and how crowded is the market?', icon: Swords },
    { name: 'Uniqueness / Moat', desc: 'What stops a competitor from copying your business overnight?', icon: Sparkles },
    { name: 'Technical Feasibility', desc: 'Can this actually be built with current technology and team resources?', icon: Wrench },
    { name: 'Business Potential', desc: 'Is there a clear, sustainable way to generate recurring revenue?', icon: DollarSign },
    { name: 'Scalability', desc: 'Can your startup grow 10x without adding 10x more cost?', icon: Layers },
    { name: 'Risk Level', desc: 'What regulatory, execution, or adoption hurdles could block launch?', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Sticky Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 bg-white ${
          scrolled ? 'shadow-md py-3' : 'py-5 border-b border-gray-100'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Rocket className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">
              IdeaValidator <span className="text-indigo-600">AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">
              How it Works
            </a>
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">
              Evaluated Parameters
            </a>
            <a href="#sample" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">
              Sample Report
            </a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition active:scale-95"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-gray-700 hover:text-indigo-600 py-1"
            >
              How it Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-gray-700 hover:text-indigo-600 py-1"
            >
              Evaluated Parameters
            </a>
            <a
              href="#sample"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-gray-700 hover:text-indigo-600 py-1"
            >
              Sample Report
            </a>
            <div className="pt-3 border-t border-gray-100 flex flex-col space-y-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="w-full text-center py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 bg-gradient-to-b from-indigo-50/50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>15-Layer AI + Rule Engine</span>
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.15] mb-6">
                Got a startup idea? <br className="hidden sm:inline" />
                Find out if it's worth building — <span className="text-indigo-600">in minutes.</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 font-normal leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                IdeaValidator AI analyzes your idea across 9 key business dimensions and gives you an honest score, clear weaknesses, and exactly what to fix next.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 transition active:scale-95 text-center flex items-center justify-center space-x-2"
                >
                  <span>Validate My Idea Free</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={scrollToSample}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold text-base transition text-center cursor-pointer"
                >
                  See a Sample Report
                </button>
              </div>
            </div>

            {/* Right Side Illustration (Inline SVG) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-gradient-to-tr from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-300/50 transform hover:scale-[1.02] transition duration-300">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                {/* SVG Lightbulb Illustration */}
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-56 mx-auto text-indigo-100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="100" cy="100" r="80" fill="white" fillOpacity="0.1" />
                  <path
                    d="M100 40C72.3858 40 50 62.3858 50 90C50 107.135 58.5919 122.259 71.6702 131.258C76.8436 134.818 80 140.669 80 146.974V150C80 155.523 84.4772 160 90 160H110C115.523 160 120 155.523 120 150V146.974C120 140.669 123.156 134.818 128.33 131.258C141.408 122.259 150 107.135 150 90C150 62.3858 127.614 40 100 40Z"
                    fill="#FEE2E2"
                    fillOpacity="0.2"
                    stroke="#ffffff"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M85 175H115"
                    stroke="#ffffff"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M80 85L95 100L125 70"
                    stroke="#10B981"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="mt-4 text-center">
                  <div className="text-3xl font-black mb-1">Score: 84 / 100</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                    Classification: Strong Idea
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOCIAL PROOF BAR */}
      <section className="bg-indigo-50 border-y border-indigo-100/80 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-6">
            Trusted by students, founders, and innovation labs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-indigo-600">500+</div>
              <div className="text-xs font-semibold text-gray-600 mt-1">Ideas Validated</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-indigo-600">9 Business</div>
              <div className="text-xs font-semibold text-gray-600 mt-1">Parameters Scored</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs">
              <div className="text-2xl sm:text-3xl font-black text-indigo-600">15-Layer</div>
              <div className="text-xs font-semibold text-gray-600 mt-1">AI + Rule Engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (3 steps) */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">How it works</h2>
            <p className="text-gray-600 mt-3 text-base">
              Get an objective validation report in 3 simple steps — no business degree required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200/80 shadow-xs hover:shadow-md transition relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center mb-6 shadow-md shadow-indigo-200">
                <Pencil className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 1</span>
              <h3 className="text-xl font-bold text-gray-900 mt-1 mb-3">Describe your idea</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Write what problem you're solving, who your customer is, and how you'll make money.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200/80 shadow-xs hover:shadow-md transition relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center mb-6 shadow-md shadow-indigo-200">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 2</span>
              <h3 className="text-xl font-bold text-gray-900 mt-1 mb-3">AI analyzes it</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our 15-layer engine checks market demand, competition, feasibility, and 6 more dimensions.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200/80 shadow-xs hover:shadow-md transition relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center mb-6 shadow-md shadow-indigo-200">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step 3</span>
              <h3 className="text-xl font-bold text-gray-900 mt-1 mb-3">Get your score + action plan</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                See exactly what's strong, what's weak, and the top 3 prioritized things to fix next.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. THE 9 PARAMETERS */}
      <section id="features" className="py-16 lg:py-24 bg-gray-50 border-y border-gray-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">What gets evaluated</h2>
            <p className="text-gray-600 mt-3 text-base">
              Every idea is scored across 9 business dimensions, each with a reason and an actionable fix.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parameters.map((param) => {
              const Icon = param.icon;
              return (
                <div
                  key={param.name}
                  className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{param.name}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{param.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. SAMPLE SCORE CARD */}
      <section id="sample" className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Here's what your report looks like
            </h2>
            <p className="text-gray-600 mt-3 text-base">
              Real validation sample generated for a student founder idea.
            </p>
          </div>

          {/* Hardcoded Realistic Mock Result Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-indigo-100 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                  Sample Validation Result
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                  AI tutor for rural school students in India
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200">
                  STRONG
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                  81% Confidence
                </span>
              </div>
            </div>

            {/* Score Display */}
            <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-100">
              <div className="text-center sm:text-left">
                <div className="text-5xl font-black text-gray-900">
                  74 <span className="text-xl text-gray-400 font-normal">/ 100</span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Overall Validation Score
                </p>
              </div>

              {/* Mini Parameter Bars */}
              <div className="w-full sm:w-64 space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Market Demand</span>
                    <span className="font-bold text-emerald-600">82/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[82%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Problem-Solution Fit</span>
                    <span className="font-bold text-emerald-600">78/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[78%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Business Potential</span>
                    <span className="font-bold text-amber-600">65/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-[65%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Preview */}
            <div className="pt-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Action Plan Recommendations
              </h4>

              <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      CRITICAL
                    </span>
                    <span className="text-xs font-bold text-gray-900">Define your pricing model</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Specify whether schools pay a B2B license or parents pay a monthly subscription.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                      HIGH
                    </span>
                    <span className="text-xs font-bold text-gray-900">Narrow your target customer age group</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Target middle school (grades 6-8) first before expanding to high school.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA below sample */}
            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition active:scale-95 inline-flex items-center space-x-2 cursor-pointer"
              >
                <span>Get your own report →</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start space-x-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Rocket className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-white">IdeaValidator AI</span>
            </div>
            <p className="text-xs text-gray-500">
              AI-assisted startup idea validation platform built for students and founders.
            </p>
          </div>

          <div className="flex flex-wrap justify-center space-x-6 text-xs font-medium">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">Contact Us</a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 pt-8 border-t border-gray-800 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} IdeaValidator AI. Built for students and founders.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
