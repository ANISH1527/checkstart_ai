import React, { useState } from 'react';
import type { RecommendationDetail, ParameterRootCause, ImprovementImpactPrediction } from '../../types/validation';
import { CheckCircle, AlertTriangle, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { validationApi } from '../../api/validation';

interface RecommendationCardProps {
  ideaId: number;
  recommendation: RecommendationDetail;
  rootCause?: ParameterRootCause;
  impactPrediction?: ImprovementImpactPrediction;
  onStatusToggle?: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  ideaId,
  recommendation,
  rootCause,
  onStatusToggle
}) => {
  const [status, setStatus] = useState<'OPEN' | 'COMPLETED'>(recommendation.status || 'OPEN');
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!recommendation.id) return;
    setLoading(true);
    try {
      const res = await validationApi.toggleRecommendationComplete(ideaId, recommendation.id);
      setStatus(res.new_status as 'OPEN' | 'COMPLETED');
      if (onStatusToggle) onStatusToggle();
    } catch (err) {
      console.error('Failed to toggle recommendation status', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const isCompleted = status === 'COMPLETED';

  return (
    <div className={`rounded-xl border p-5 transition-all duration-200 ${
      isCompleted 
        ? 'bg-slate-900/40 border-slate-800 opacity-65' 
        : 'bg-slate-900/80 border-slate-700/60 hover:border-indigo-500/50 shadow-lg'
    }`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${getPriorityStyle(recommendation.priority)}`}>
            {recommendation.priority || 'HIGH'} PRIORITY
          </span>
          {recommendation.parameter && (
            <span className="text-sm font-medium text-slate-300">
              {recommendation.parameter.replace(/_/g, ' ').toUpperCase()}
              {recommendation.current_score !== undefined && (
                <span className="ml-1 text-xs font-bold text-indigo-400">
                  ({Math.round(recommendation.current_score)}/100)
                </span>
              )}
            </span>
          )}
        </div>

        <button
          onClick={handleToggle}
          disabled={loading || !recommendation.id}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
              : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-md'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {isCompleted ? 'Completed' : 'Mark as Completed'}
        </button>
      </div>

      {/* Grid Content */}
      <div className="space-y-4 text-sm">
        {/* Why is this weak? */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Why is this weak?
          </div>
          <p className="text-slate-300 leading-relaxed pl-5 border-l-2 border-amber-500/40">
            {recommendation.root_cause || (rootCause?.root_causes[0]?.cause) || 'Score indicates parameter weakness based on current input parameters.'}
          </p>
        </div>

        {/* Missing information */}
        {recommendation.missing_information && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              What information is missing?
            </div>
            <p className="text-slate-300 pl-5 border-l-2 border-rose-500/40">
              {recommendation.missing_information}
            </p>
          </div>
        )}

        {/* Recommended Action */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <ArrowRight className="w-3.5 h-3.5" />
            Recommended action
          </div>
          <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-100 font-medium leading-relaxed">
            {recommendation.action}
          </div>
        </div>

        {/* Why it matters & Validation Method */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {recommendation.why_it_matters && (
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="block text-xs font-semibold text-slate-400 mb-1">Why it matters</span>
              <p className="text-slate-300 text-xs leading-relaxed">{recommendation.why_it_matters}</p>
            </div>
          )}

          {recommendation.validation_method && (
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="block text-xs font-semibold text-slate-400 mb-1">How do I validate this?</span>
              <p className="text-slate-300 text-xs leading-relaxed">{recommendation.validation_method}</p>
            </div>
          )}
        </div>

        {/* Expected Impact */}
        {recommendation.expected_impact && (
          <div className="flex items-start gap-2 pt-1 text-xs text-emerald-400/90 bg-emerald-950/30 p-2.5 rounded-md border border-emerald-500/20">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-emerald-300">Expected / Potential Impact: </span>
              <span>{recommendation.expected_impact}</span>
              <span className="block text-[10px] text-emerald-400/70 italic mt-0.5">* Actual impact measured post re-validation</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
