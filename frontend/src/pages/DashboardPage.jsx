import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import apiClient from '../api/client';
import IdeaCard from '../components/IdeaCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { PlusCircle, Lightbulb, CheckCircle2, Award, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ideas, setIdeas] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showOnboarding, setShowOnboarding] = useState(false);

  const fetchIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/ideas?limit=${limit}&offset=${offset}`);
      if (data && Array.isArray(data.items)) {
        setIdeas(data.items);
        setTotal(data.total || data.items.length);

        // Check onboarding state (Prompt 7)
        if (data.items.length === 0 && !localStorage.getItem('onboarding_shown')) {
          setShowOnboarding(true);
        }
      } else if (Array.isArray(data)) {
        setIdeas(data);
        setTotal(data.length);
      } else {
        setIdeas([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load ideas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [offset]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleDismissOnboarding = () => {
    localStorage.setItem('onboarding_shown', 'true');
    setShowOnboarding(false);
  };

  // Stats computation
  const totalCount = total || ideas.length;
  const validatedIdeas = ideas.filter(
    (i) => i.is_validated || (i.latest_score !== undefined && i.latest_score !== null && i.latest_score > 0)
  );
  const validatedCount = validatedIdeas.length;

  const avgScore =
    validatedCount > 0
      ? Math.round(
          validatedIdeas.reduce((sum, i) => sum + (i.latest_score || i.overall_score || 0), 0) /
            validatedCount
        )
      : '—';

  const bestClassification = () => {
    if (validatedCount === 0) return '—';
    const ranks = { EXCEPTIONAL: 5, STRONG: 4, MODERATE: 3, WEAK: 2, VERY_WEAK: 1 };
    let best = '—';
    let bestRank = 0;
    validatedIdeas.forEach((i) => {
      const cls = (i.latest_classification || i.classification || '').toUpperCase();
      if (ranks[cls] && ranks[cls] > bestRank) {
        bestRank = ranks[cls];
        best = i.latest_classification || i.classification;
      }
    });
    return best;
  };

  const handleDeleteIdeaSuccess = (deletedId) => {
    setIdeas((prev) => prev.filter((i) => i.id !== deletedId));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="space-y-8">
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {getTimeGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Founder'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Here are your startup ideas. Click any idea to view its full validation report.
          </p>
        </div>

        <button
          onClick={() => navigate('/ideas/new')}
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition active:scale-95 cursor-pointer flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Idea</span>
        </button>
      </div>

      {/* ONBOARDING BANNER (Prompt 7) */}
      {showOnboarding && (
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white p-6 rounded-2xl shadow-lg relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <button
            onClick={handleDismissOnboarding}
            className="absolute top-4 right-4 text-indigo-200 hover:text-white focus:outline-none"
            aria-label="Dismiss onboarding"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2 font-bold text-sm mb-1">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>👋 Welcome! Here's how to get started:</span>
            </div>
            <p className="text-xs text-indigo-100 max-w-xl">
              1. <strong>Add your idea</strong> details → 2. <strong>Run 15-layer AI validation</strong> → 3. <strong>Get your score & action plan</strong>
            </p>
          </div>

          <button
            onClick={handleDismissOnboarding}
            className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs shadow-md hover:bg-indigo-50 transition flex-shrink-0 cursor-pointer"
          >
            Got it, let's go!
          </button>
        </div>
      )}

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ideas */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{totalCount}</div>
            <div className="text-xs font-semibold text-gray-500">Total Ideas</div>
          </div>
        </div>

        {/* Validated */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{validatedCount}</div>
            <div className="text-xs font-semibold text-gray-500">Validated</div>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">
              {avgScore} {typeof avgScore === 'number' && <span className="text-xs text-gray-400 font-normal">/ 100</span>}
            </div>
            <div className="text-xs font-semibold text-gray-500">Average Score</div>
          </div>
        </div>

        {/* Best Performing */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-gray-900 truncate">
              {bestClassification()}
            </div>
            <div className="text-xs font-semibold text-gray-500">Best Performing</div>
          </div>
        </div>
      </div>

      {/* 3. CONTENT AREA: Skeleton / Error / Empty / Grid */}
      {loading ? (
        /* SKELETON LOADING STATE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs animate-pulse">
              <div className="w-24 h-5 bg-gray-200 rounded-full mb-4" />
              <div className="w-3/4 h-6 bg-gray-200 rounded-md mb-3" />
              <div className="w-full h-12 bg-gray-200 rounded-md mb-4" />
              <div className="w-full h-2 bg-gray-200 rounded-full mb-4" />
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <div className="w-16 h-4 bg-gray-200 rounded-md" />
                <div className="w-24 h-8 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchIdeas} />
      ) : ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="You haven't added any ideas yet"
          subtitle="Start by describing your startup idea. Our AI will analyze it and tell you exactly what's working and what needs fixing."
          actionLabel="Add my first idea →"
          onAction={() => navigate('/ideas/new')}
        />
      ) : (
        /* IDEAS GRID */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Your Ideas</h2>
            <span className="text-xs text-gray-500 font-medium">
              Showing {ideas.length} of {total} ideas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onDeleteSuccess={handleDeleteIdeaSuccess} />
            ))}
          </div>

          {/* PAGINATION */}
          {total > limit && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500 font-medium">
                Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} ideas
              </span>

              <div className="flex space-x-2">
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={offset + limit >= total}
                  onClick={() => setOffset(offset + limit)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
