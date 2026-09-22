import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FileDown, Printer, CheckCircle2, AlertCircle, Info, Sparkles, 
  ArrowLeft, ArrowUpRight, TrendingUp, Check, HelpCircle, RefreshCw
} from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [idea, setIdea] = useState(null);
  const [validation, setValidation] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadReportData() {
      try {
        setLoading(true);
        // Fetch idea & validation in parallel
        const [ideaData, validationData] = await Promise.all([
          apiClient.get(`/ideas/${id}`),
          apiClient.get(`/ideas/${id}/validation`).catch(() => null)
        ]);

        if (isMounted) {
          setIdea(ideaData);
          setValidation(validationData);
          if (validationData?.recommendations) {
            setRecommendations(validationData.recommendations);
          }

          // If idea has version >= 2, try to fetch version comparison
          if (ideaData?.version >= 2) {
            try {
              const compData = await apiClient.get(`/ideas/${id}/comparison?v1=${ideaData.version - 1}&v2=${ideaData.version}`);
              setComparison(compData);
            } catch (_) {
              // Ignore if comparison endpoint unavailable
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load report details.");
          toast.error("Error loading report");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadReportData();
    return () => { isMounted = false; };
  }, [id]);

  const handleDownloadMarkdown = async () => {
    try {
      const res = await apiClient.get(`/reports/${id}/markdown`);
      const mdContent = typeof res === 'string' ? res : (res?.markdown || res?.content || JSON.stringify(res, null, 2));
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `idea-${id}-report.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Markdown report downloaded!");
    } catch (err) {
      toast.error(err.message || "Failed to download markdown report.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleRecommendationComplete = async (recId) => {
    try {
      const updated = recommendations.map(r => r.id === recId ? { ...r, is_completed: !r.is_completed } : r);
      setRecommendations(updated);

      await apiClient.post(`/ideas/${id}/recommendations/${recId}/complete`);
      toast.success("Status updated!");
    } catch (err) {
      toast.error("Failed to update recommendation status.");
    }
  };

  const markAllCompleteInPriority = async (priorityGroup) => {
    const idsToComplete = recommendations
      .filter(r => (r.priority?.toUpperCase() === priorityGroup) && !r.is_completed)
      .map(r => r.id);

    if (idsToComplete.length === 0) return;

    setRecommendations(prev => prev.map(r => 
      idsToComplete.includes(r.id) ? { ...r, is_completed: true } : r
    ));

    for (const recId of idsToComplete) {
      try {
        await apiClient.post(`/ideas/${id}/recommendations/${recId}/complete`);
      } catch (_) {}
    }
    toast.success(`Marked all ${priorityGroup.toLowerCase()} priority items complete!`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Generating evaluation report...</p>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl mb-4 inline-block">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Report Unavailable</h2>
        <p className="text-gray-600 mt-2">{error || "Could not find idea or validation report."}</p>
        <Link to="/dashboard" className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const overallScore = validation?.overall_score ?? validation?.score ?? idea?.latest_score ?? 0;
  const classification = validation?.classification ?? idea?.latest_classification ?? 'UNVALIDATED';
  const confidence = validation?.confidence_score ?? validation?.confidence ?? 80;

  // Extract parameters object or list
  const rawParams = validation?.parameter_scores || validation?.parameters || {};
  let paramList = Array.isArray(rawParams) 
    ? rawParams 
    : Object.entries(rawParams).map(([name, data]) => ({
        name: typeof data === 'object' ? (data.name || name) : name,
        score: typeof data === 'object' ? (data.score ?? 50) : Number(data),
        reason: typeof data === 'object' ? (data.reason || data.justification || '') : ''
      }));

  // Fallback if paramList empty
  if (paramList.length === 0 && validation?.scores) {
    paramList = Object.entries(validation.scores).map(([name, score]) => ({
      name,
      score: Number(score),
      reason: ''
    }));
  }

  // Sorted lowest scores first for breakdown
  const sortedParams = [...paramList].sort((a, b) => a.score - b.score);
  // Strengths (>= 70)
  const strengths = paramList.filter(p => p.score >= 70);

  // Group recommendations by priority
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const groupedRecs = priorities.reduce((acc, p) => {
    acc[p] = recommendations.filter(r => (r.priority?.toUpperCase() || 'MEDIUM') === p);
    return acc;
  }, {});

  const infoGaps = validation?.information_gaps || validation?.gaps || [];

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'CRITICAL': return { bg: 'bg-red-50 border-red-200', text: 'text-red-800', badge: 'bg-red-600 text-white', label: '🔴 Critical — Fix these first' };
      case 'HIGH': return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', badge: 'bg-orange-500 text-white', label: '🟠 High Priority — Important improvements' };
      case 'MEDIUM': return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', badge: 'bg-amber-500 text-white', label: '🟡 Medium Priority — Good to have' };
      case 'LOW': return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-800', badge: 'bg-gray-500 text-white', label: '⚪ Low Priority — Fine tuning' };
      default: return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-800', badge: 'bg-gray-500 text-white', label: 'Action Items' };
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 55) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 print:px-0 print:py-0">
      
      {/* Print-specific style block */}
      <style>{`
        @media print {
          nav, header, footer, .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* Top Controls (Hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print border-b pb-4">
        <Link to={`/ideas/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Idea
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadMarkdown}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition inline-flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" /> Download Markdown
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition inline-flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* SECTION 1 — REPORT HEADER */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
            Validation Report
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {idea.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-600">
          <span className="px-3 py-1 bg-gray-100 rounded-full font-semibold">
            Version V{idea.version || 1}
          </span>
          <span>
            Validated: {idea.created_at ? new Date(idea.created_at).toLocaleDateString() : 'Recently'}
          </span>
          
          {/* Confidence Badge + Info Tooltip */}
          <div className="relative group inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold">
            <span>{confidence}% Confidence</span>
            <Info className="w-3.5 h-3.5 text-indigo-500 cursor-pointer" aria-label="Confidence Info" />
            
            {/* Tooltip */}
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-lg z-20 font-normal leading-relaxed pointer-events-none">
              Confidence reflects how complete your idea description is. A higher confidence means our analysis is based on more concrete information. Add missing details to improve it.
              <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-gray-500 block mb-1">Overall Classification</span>
            <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-800 text-sm font-bold rounded-full border border-indigo-200">
              {classification}
            </span>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-gray-500 block">Validation Score</span>
            <span className="text-3xl font-black text-indigo-600">
              {overallScore} <span className="text-lg font-normal text-gray-400">/ 100</span>
            </span>
          </div>
        </div>

        {/* Full width score progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, overallScore))}%` }}
          ></div>
        </div>
      </section>

      {/* SECTION 2 — SCORE BREAKDOWN */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 border-b pb-3">
          How your idea scored
        </h2>
        <p className="text-xs text-gray-500">Sorted showing weakest parameters first</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedParams.map((param, index) => (
            <div key={index} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">{param.name}</h3>
                  <span className="font-extrabold text-sm text-gray-700">{param.score}<span className="text-xs text-gray-400">/100</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                  <div
                    className={`h-full rounded-full ${getScoreColor(param.score)}`}
                    style={{ width: `${Math.max(0, Math.min(100, param.score))}%` }}
                  ></div>
                </div>
              </div>
              {param.reason && (
                <p className="text-xs text-gray-500 italic line-clamp-3 mt-2">
                  "{param.reason}"
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — WHAT'S WORKING */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold text-gray-900">Strengths</h2>
        </div>

        {strengths.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {strengths.map((item, i) => (
              <div key={i} className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 flex items-start gap-3">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-emerald-950 text-sm">{item.name}</h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {item.score}/100
                    </span>
                  </div>
                  {item.reason && (
                    <p className="text-xs text-emerald-800 mt-1">
                      {item.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-6 text-center text-sm text-gray-600 border border-gray-100">
            No strong areas yet (score ≥ 70) — this is normal for a first draft. Use the action plan below to build strength.
          </div>
        )}
      </section>

      {/* SECTION 4 — ACTION PLAN */}
      <section className="space-y-6 page-break">
        <div className="border-b pb-3">
          <h2 className="text-xl font-bold text-gray-900">Your Action Plan</h2>
          <p className="text-xs text-gray-500 mt-1">Start with CRITICAL items first</p>
        </div>

        {priorities.map((priorityKey) => {
          const recs = groupedRecs[priorityKey];
          if (!recs || recs.length === 0) return null;

          const style = getPriorityStyle(priorityKey);

          return (
            <div key={priorityKey} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${style.bg} ${style.text}`}>
                  {style.label}
                </h3>
                <button
                  onClick={() => markAllCompleteInPriority(priorityKey)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition no-print"
                >
                  Mark all complete
                </button>
              </div>

              <div className="space-y-3">
                {recs.map((rec, idx) => (
                  <div 
                    key={rec.id || idx}
                    className={`bg-white rounded-2xl p-5 border shadow-sm transition ${rec.is_completed ? 'bg-gray-50/70 border-gray-200' : 'border-gray-100'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${style.badge}`}>
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className={`font-bold text-base ${rec.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {rec.action}
                          </h4>
                          {rec.why_it_matters && (
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {rec.why_it_matters}
                            </p>
                          )}
                          {rec.validation_method && (
                            <p className="text-xs text-indigo-600 italic mt-2">
                              Validation method: {rec.validation_method}
                            </p>
                          )}
                          {rec.impacted_parameter && (
                            <p className="text-xs text-emerald-600 font-medium mt-1">
                              Expected to improve: {rec.impacted_parameter}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleRecommendationComplete(rec.id)}
                        className={`no-print shrink-0 p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${rec.is_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        aria-label={`Mark ${rec.action} complete`}
                      >
                        <Check className="w-4 h-4" />
                        {rec.is_completed ? 'Completed' : 'Mark Done'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* SECTION 5 — VERSION COMPARISON */}
      {idea.version >= 2 && comparison && (
        <section className="space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-xl font-bold text-gray-900">How you've improved</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-2xl font-black ${comparison.score_delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {comparison.score_delta >= 0 ? `+${comparison.score_delta}` : comparison.score_delta} points
              </span>
              <span className="text-xs text-gray-500">since Version {comparison.v1_version || 1}</span>
            </div>
          </div>

          {/* Desktop Table (md+) */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Parameter</th>
                  <th className="py-3 px-4 text-center">V{comparison.v1_version || 1} Score</th>
                  <th className="py-3 px-4 text-center">V{comparison.v2_version || idea.version} Score</th>
                  <th className="py-3 px-4 text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(comparison.parameter_changes || []).map((row, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4 font-semibold text-gray-900">{row.parameter}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{row.v1_score}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-600">{row.v2_score}</td>
                    <td className="py-3 px-4 text-right font-bold">
                      {row.delta > 0 && <span className="text-emerald-600">+{row.delta} ↑</span>}
                      {row.delta < 0 && <span className="text-red-600">{row.delta} ↓</span>}
                      {row.delta === 0 && <span className="text-gray-400">=</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards Layout (< md) */}
          <div className="block md:hidden space-y-3">
            {(comparison.parameter_changes || []).map((row, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{row.parameter}</h4>
                  <div className="text-xs text-gray-500 mt-0.5">
                    V1: {row.v1_score} → <span className="font-bold text-indigo-600">V2: {row.v2_score}</span>
                  </div>
                </div>
                <div className="text-sm font-bold">
                  {row.delta > 0 && <span className="text-emerald-600">+{row.delta} ↑</span>}
                  {row.delta < 0 && <span className="text-red-600">{row.delta} ↓</span>}
                  {row.delta === 0 && <span className="text-gray-400">=</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 6 — INFORMATION GAPS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <HelpCircle className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-bold text-gray-900">What we couldn't evaluate</h2>
        </div>
        <p className="text-xs text-gray-500">
          These are missing from your idea description. Filling them in could improve your score.
        </p>

        {infoGaps.length > 0 ? (
          <div className="space-y-3">
            {infoGaps.map((gap, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-start gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{gap.gap || gap.title || gap.name}</h4>
                  <p className="text-xs text-gray-600 mt-0.5">{gap.suggestion || gap.description || gap.what_to_add}</p>
                  {gap.impacted_parameter && (
                    <span className="text-[11px] text-indigo-600 font-semibold block mt-1">
                      Impacts: {gap.impacted_parameter}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-50 rounded-2xl p-5 text-emerald-800 text-sm font-medium border border-emerald-100 text-center">
            Your idea description is comprehensive 👍
          </div>
        )}
      </section>

      {/* SECTION 7 — NEXT STEPS BANNER */}
      <section className="no-print bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white text-center shadow-lg space-y-4">
        <h3 className="text-xl font-extrabold">
          Updated your idea based on these recommendations?
        </h3>
        <p className="text-indigo-100 text-xs sm:text-sm max-w-lg mx-auto">
          Each re-validation creates a new version so you can track your progress over time.
        </p>
        <div>
          <button
            onClick={() => navigate(`/ideas/${id}/validate`)}
            className="px-8 py-3.5 bg-white hover:bg-indigo-50 text-indigo-600 font-extrabold rounded-xl transition shadow-md focus:ring-2 focus:ring-white inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Re-validate Now
          </button>
        </div>
      </section>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-xs text-gray-400 pt-8 border-t mt-12">
        Generated by IdeaValidator AI • {window.location.href}
      </div>

    </div>
  );
}
