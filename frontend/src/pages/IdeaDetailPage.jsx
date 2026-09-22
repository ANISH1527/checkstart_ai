import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import ValidationSummaryCard from '../components/ValidationSummaryCard';
import RecommendationCard from '../components/RecommendationCard';
import ScoreRing from '../components/ScoreRing';
import ParameterBar from '../components/ParameterBar';
import ErrorState from '../components/ErrorState';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  RotateCw, 
  FileText, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Info,
  Calendar,
  Layers
} from 'lucide-react';

const IdeaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [idea, setIdea] = useState(null);
  const [validation, setValidation] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfTooltip, setShowConfTooltip] = useState(false);

  const fetchIdeaData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch idea metadata
      const ideaData = await apiClient.get(`/ideas/${id}`);
      setIdea(ideaData);

      // Attempt to fetch validation result
      try {
        const valData = await apiClient.get(`/ideas/${id}/validation`);
        setValidation(valData);
        if (valData && valData.recommendations) {
          setRecommendations(valData.recommendations);
        }
      } catch (valErr) {
        // Idea might not be validated yet (404)
        setValidation(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load idea details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeaData();
  }, [id]);

  const handleToggleRecComplete = async (recId) => {
    try {
      const res = await apiClient.post(`/ideas/${id}/recommendations/${recId}/complete`);
      const newStatus = res.new_status || 'COMPLETED';

      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === recId || r.rec_id === recId ? { ...r, status: newStatus } : r
        )
      );

      toast.success(newStatus === 'COMPLETED' ? 'Action marked complete!' : 'Action reopened');
    } catch (err) {
      toast.error('Failed to update action status');
    }
  };

  // Helper to parse description into section blocks
  const parseDescription = (desc) => {
    if (!desc) return [];
    const sections = [];
    const keywords = ['PROBLEM:', 'SOLUTION:', 'REVENUE MODEL:', 'REVENUE:', 'TECH STACK:', 'TECH:'];
    
    // Check if formatted with headers
    let currentHeader = 'DESCRIPTION';
    let currentText = [];

    const lines = desc.split('\n');
    lines.forEach((line) => {
      const matchedKeyword = keywords.find((kw) => line.trim().startsWith(kw));
      if (matchedKeyword) {
        if (currentText.length > 0) {
          sections.push({ header: currentHeader, text: currentText.join('\n').trim() });
        }
        currentHeader = matchedKeyword.replace(':', '');
        currentText = [line.replace(matchedKeyword, '').trim()];
      } else {
        currentText.push(line);
      }
    });

    if (currentText.length > 0) {
      sections.push({ header: currentHeader, text: currentText.join('\n').trim() });
    }

    return sections;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getClassificationBadge = (cls) => {
    const c = (cls || 'MODERATE').toUpperCase();
    switch (c) {
      case 'EXCEPTIONAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'STRONG':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'WEAK':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'VERY_WEAK':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4" />
        <p className="text-xs text-gray-500 font-medium">Loading idea analysis...</p>
      </div>
    );
  }

  if (error || !idea) {
    return <ErrorState message={error || 'Idea not found'} onRetry={fetchIdeaData} />;
  }

  const isValidated = !!validation;
  const confidenceScore = validation?.confidence_score || validation?.confidence || 75;

  // Sort recommendations: Open first (grouped by priority), completed last
  const openRecs = recommendations.filter((r) => r.status !== 'COMPLETED');
  const completedRecs = recommendations.filter((r) => r.status === 'COMPLETED');
  const sortedRecommendations = [...openRecs, ...completedRecs];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {isValidated && (
          <Link
            to={`/ideas/${id}/report`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-xs transition"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Full Markdown Report</span>
          </Link>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (60% -> lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Idea Header & Description Blocks */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full text-xs flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Version {idea.version || 1}</span>
              </span>
              <span className="text-xs text-gray-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created {formatDate(idea.created_at)}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug mb-6">
              {idea.title}
            </h1>

            {/* Target Customer Badge if present */}
            {idea.target_customer && (
              <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Target Customer
                </span>
                <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                  {idea.target_customer}
                </p>
              </div>
            )}

            {/* Formatted Description Blocks */}
            <div className="space-y-4 pt-2">
              {parseDescription(idea.description).map((sec, i) => (
                <div key={i} className="space-y-1">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    {sec.header}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
                    {sec.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. UNVALIDATED BANNER (if not validated yet) */}
          {!isValidated && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 sm:p-8 text-center shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-amber-900 mb-1">This idea hasn't been validated yet</h3>
              <p className="text-xs text-amber-700 max-w-md mx-auto mb-6 leading-relaxed">
                Run our 15-layer AI validation engine to discover market demand, competition risks, and your detailed action plan.
              </p>
              <button
                onClick={() => navigate(`/ideas/${id}/validate`)}
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition active:scale-95 inline-flex items-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Validate This Idea Now →</span>
              </button>
            </div>
          )}

          {/* 3. VALIDATION SUMMARY CARD (if validated) */}
          {isValidated && <ValidationSummaryCard validation={validation} />}

          {/* 4. RECOMMENDATIONS ACTION PLAN */}
          {isValidated && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Your Action Plan</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Complete these recommendations to improve your validation score.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {openRecs.length} Action{openRecs.length !== 1 ? 's' : ''} Remaining
                </span>
              </div>

              {sortedRecommendations.length > 0 ? (
                <div>
                  {sortedRecommendations.map((rec, idx) => (
                    <RecommendationCard
                      key={rec.id || rec.rec_id || idx}
                      rec={rec}
                      index={idx}
                      onToggleComplete={handleToggleRecComplete}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-6">
                  No specific recommendations required. Your idea draft is solid!
                </p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (40% -> lg:col-span-5, Sticky Desktop Sidebar) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          {isValidated ? (
            /* SCORE BREAKDOWN CARD */
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-6">
              <div className="text-center pb-6 border-b border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-3">
                  Overall Score Breakdown
                </span>

                <div className="flex justify-center mb-4">
                  <ScoreRing score={validation.overall_score || 0} size={130} strokeWidth={10} />
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <span
                    className={`text-xs font-black px-3.5 py-1 rounded-full border uppercase tracking-wider ${getClassificationBadge(
                      validation.classification
                    )}`}
                  >
                    {validation.classification || 'VALIDATED'}
                  </span>

                  {/* Confidence Score Tooltip (Prompt 7) */}
                  <div className="relative inline-flex items-center">
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
                      <span>{Math.round(confidenceScore)}% Confidence</span>
                      <button
                        onMouseEnter={() => setShowConfTooltip(true)}
                        onMouseLeave={() => setShowConfTooltip(false)}
                        className="text-gray-400 hover:text-indigo-600 focus:outline-none ml-1"
                        aria-label="Confidence explanation"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </span>

                    {showConfTooltip && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-60 p-3 bg-gray-900 text-white text-[11px] rounded-xl shadow-xl z-30 pointer-events-none leading-relaxed">
                        Confidence reflects how complete your idea description is. Add missing details to improve score accuracy.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 9 PARAMETERS PROGRESS BARS */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4">
                  Parameter Scores
                </h4>

                <div className="space-y-3">
                  {validation.scores ? (
                    Object.entries(validation.scores).map(([paramKey, scoreVal]) => (
                      <ParameterBar key={paramKey} name={paramKey} score={scoreVal} />
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No score breakdown available.</p>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 border-t border-gray-100 space-y-2.5">
                <button
                  onClick={() => navigate(`/ideas/${id}/validate`)}
                  className="w-full py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Re-validate after making changes</span>
                </button>

                <Link
                  to={`/ideas/${id}/report`}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition text-center block cursor-pointer"
                >
                  View Full Report & Export →
                </Link>
              </div>
            </div>
          ) : (
            /* UNVALIDATED SIDEBAR CTA */
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-6 shadow-xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-200" />
              </div>
              <h3 className="text-xl font-bold">Ready to test your concept?</h3>
              <p className="text-xs text-indigo-100 leading-relaxed">
                Run our validation pipeline to see how your idea ranks across market demand, technical feasibility, and business potential.
              </p>
              <button
                onClick={() => navigate(`/ideas/${id}/validate`)}
                className="w-full py-3.5 rounded-xl bg-white text-indigo-800 hover:bg-indigo-50 font-bold text-xs shadow-md transition cursor-pointer"
              >
                Validate Idea Now →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdeaDetailPage;
