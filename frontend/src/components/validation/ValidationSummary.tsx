import React from 'react';
import type { ValidationResponse } from '../../types/validation';
import { RecommendationCard } from './RecommendationCard';
import { TopActionsSummary } from './TopActionsSummary';
import { VersionComparison } from '../history/VersionComparison';
import {
  Award,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
  Download,
  RotateCcw
} from 'lucide-react';

interface ValidationSummaryProps {
  validation: ValidationResponse;
  onRevalidate?: () => void;
  onDownloadReport?: () => void;
  revalidating?: boolean;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  validation,
  onRevalidate,
  onDownloadReport,
  revalidating = false
}) => {
  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'EXCEPTIONAL':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'STRONG':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'MODERATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'WEAK':
      case 'VERY_WEAK':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-8 my-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded-md border border-cyan-800/60">
              VERSION {validation.version}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getClassificationBadge(validation.classification)}`}>
              {validation.classification}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-2">Startup Validation & Improvement Intelligence</h2>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadReport && (
            <button
              onClick={onDownloadReport}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Report</span>
            </button>
          )}

          {onRevalidate && (
            <button
              onClick={onRevalidate}
              disabled={revalidating}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${revalidating ? 'animate-spin' : ''}`} />
              <span>{revalidating ? 'Re-validating...' : 'Improve & Re-validate'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Score Gauge & Confidence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overall Score */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall Validation Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold text-white">{validation.overall_score}</span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Calculated via deterministic weighted formula</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border-2 border-cyan-500 flex items-center justify-center text-cyan-400">
            <Award className="w-8 h-8" />
          </div>
        </div>

        {/* Confidence Score */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Assessment Confidence</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold text-white">{validation.confidence_score}%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Based on detail completeness & rule consistency</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* 9-Parameter Breakdown */}
      <div>
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>Parameter Performance Breakdown</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(validation.scores).map(([param, score]) => (
            <div key={param} className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-300 capitalize">{param.replace(/_/g, ' ')}</span>
                <span className="font-mono font-bold text-cyan-400">{score}/100</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    score >= 80 ? 'bg-cyan-400' : score >= 65 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 3 Actions Summary */}
      {validation.top_3_actions && validation.top_3_actions.length > 0 && (
        <TopActionsSummary topActions={validation.top_3_actions} />
      )}

      {/* Structured Improvement Recommendations Section */}
      {validation.recommendations && validation.recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-indigo-400" />
            <span>Structured Improvement Recommendations</span>
          </h3>
          <div className="space-y-4">
            {validation.recommendations.map((rec, i) => {
              const rc = validation.root_causes?.find(r => r.parameter === rec.parameter);
              const imp = validation.impact_predictions?.find(p => p.action === rec.action);
              return (
                <RecommendationCard
                  key={rec.id || i}
                  ideaId={validation.idea_id}
                  recommendation={rec}
                  rootCause={rc}
                  impactPrediction={imp}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Version Comparison Section (if V2+) */}
      {validation.version > 1 && (
        <VersionComparison ideaId={validation.idea_id} />
      )}

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        {validation.strengths.length > 0 && (
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Key Strengths</span>
            </h4>
            <ul className="space-y-2">
              {validation.strengths.map((str, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {validation.weaknesses.length > 0 && (
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              <span>Areas Needing Improvement</span>
            </h4>
            <ul className="space-y-2">
              {validation.weaknesses.map((weak, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Information Gaps */}
      {validation.information_gaps && validation.information_gaps.length > 0 && (
        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>Information Gaps Detected</span>
          </h4>
          <div className="space-y-2">
            {validation.information_gaps.map((gap, i) => (
              <div key={i} className="text-xs text-slate-300 border-l-2 border-amber-500/60 pl-3 py-1">
                <p className="font-semibold text-slate-200">{gap.question}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{gap.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
