import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import { Sparkles, ArrowLeft, CheckCircle2, XCircle, Save } from 'lucide-react';

const NewIdeaPage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [revenueModel, setRevenueModel] = useState('');
  const [techStack, setTechStack] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!problem.trim()) errs.problem = 'Problem description is required';
    if (!solution.trim()) errs.solution = 'Solution description is required';
    if (!targetCustomer.trim()) errs.targetCustomer = 'Target customer is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    // Combine sections into description string
    const description = [
      `PROBLEM:\n${problem.trim()}`,
      `SOLUTION:\n${solution.trim()}`,
      revenueModel.trim() ? `REVENUE MODEL:\n${revenueModel.trim()}` : '',
      techStack.trim() ? `TECH STACK:\n${techStack.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const data = await apiClient.post('/ideas', {
        title: title.trim(),
        description,
        target_customer: targetCustomer.trim(),
      });

      const newId = data.id || data;
      toast.success('Idea saved! Now validate it to get your score.');
      navigate(`/ideas/${newId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to save idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Form (Left 65%) */}
        <div className="flex-1 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Add New Startup Idea</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Fill in the details below. The more specific you are, the higher accuracy your validation score will be.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Idea Title */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="title" className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  1. Idea Title <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-400 font-mono">{title.length}/200</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Give your idea a short name. Example: "AI Tutor for Rural Schools" or "B2B Inventory App for Small Retailers"
              </p>
              <input
                id="title"
                type="text"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI Legal Assistant for Small Businesses"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition ${
                  errors.title ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                }`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1 font-medium">{errors.title}</p>}
            </div>

            {/* 2. Problem You're Solving */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="problem" className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  2. Problem You're Solving <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-400 font-mono">{problem.length}/3000</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Describe the problem your customer faces today. Be specific — "Students in rural areas have no access to qualified tutors" is better than "education is broken".
              </p>
              <textarea
                id="problem"
                rows={4}
                maxLength={3000}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Describe the exact pain point, frustration, or inefficiency your target customer experiences..."
                className={`w-full border rounded-xl p-4 text-sm focus:outline-none transition ${
                  errors.problem ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                }`}
              />
              {errors.problem && <p className="text-xs text-red-500 mt-1 font-medium">{errors.problem}</p>}
            </div>

            {/* 3. Your Solution */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="solution" className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  3. Your Solution <span className="text-red-500">*</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                How does your product solve this problem? What does it do, and how is it different from what exists today?
              </p>
              <textarea
                id="solution"
                rows={4}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Explain how your solution works, core features, and unique approach..."
                className={`w-full border rounded-xl p-4 text-sm focus:outline-none transition ${
                  errors.solution ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                }`}
              />
              {errors.solution && <p className="text-xs text-red-500 mt-1 font-medium">{errors.solution}</p>}
            </div>

            {/* 4. Target Customer */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="targetCustomer" className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                  4. Who is your Target Customer? <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-400 font-mono">{targetCustomer.length}/1000</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Be specific. "Parents of school-going children aged 8-14 in tier-2 cities in India" is better than "everyone".
              </p>
              <textarea
                id="targetCustomer"
                rows={3}
                maxLength={1000}
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                placeholder="Specify demographic, location, role, or business type..."
                className={`w-full border rounded-xl p-4 text-sm focus:outline-none transition ${
                  errors.targetCustomer ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                }`}
              />
              {errors.targetCustomer && <p className="text-xs text-red-500 mt-1 font-medium">{errors.targetCustomer}</p>}
            </div>

            {/* 5. Revenue Model */}
            <div>
              <label htmlFor="revenueModel" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                5. How Will You Make Money? (Revenue Model)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Example: Monthly subscription of Rs 299/month, or B2B license of Rs 5000/month per school.
              </p>
              <textarea
                id="revenueModel"
                rows={2}
                value={revenueModel}
                onChange={(e) => setRevenueModel(e.target.value)}
                placeholder="Pricing structure, subscription tiers, commission rate..."
                className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* 6. Tech Stack (optional) */}
            <div>
              <label htmlFor="techStack" className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                6. Tech Stack (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                What technology will you use? Example: React Native app, Python ML backend. Leave blank if unsure.
              </p>
              <input
                id="techStack"
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="e.g. Next.js, Python FastAPI, Gemini API, PostgreSQL"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block" />
                    <span>Saving Idea...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save My Idea</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Desktop Sidebar (Tips Card - Right 35%) */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-6 sticky top-24">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm mb-4">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Tips for a high score</span>
            </div>

            <div className="space-y-3.5 text-xs text-gray-700">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Include a specific, narrow customer type</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Mention how you'll charge money & pricing</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Describe what makes your solution unique</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Name your technology stack if you have one</span>
              </div>
              <div className="pt-2 border-t border-indigo-100 flex items-start space-x-2.5 text-red-700">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Avoid vague phrases like "everyone" or "all businesses"</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewIdeaPage;
