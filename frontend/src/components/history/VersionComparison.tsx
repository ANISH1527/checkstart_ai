import React, { useEffect, useState } from 'react';
import type { VersionComparisonResult } from '../../types/validation';
import { validationApi } from '../../api/validation';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Layers } from 'lucide-react';

interface VersionComparisonProps {
  ideaId: number;
}

export const VersionComparison: React.FC<VersionComparisonProps> = ({ ideaId }) => {
  const [data, setData] = useState<VersionComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await validationApi.getValidationComparison(ideaId);
      setData(res);
    } catch (err) {
      console.error('Failed to load version comparison', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [ideaId]);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400 animate-pulse text-sm">
        Loading version comparison data...
      </div>
    );
  }

  if (!data || !data.has_comparison) {
    return (
      <div className="p-6 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-xs">
        <Layers className="w-6 h-6 mx-auto mb-2 text-slate-500" />
        Re-validate your startup idea after making improvements to unlock version-over-version score comparison and progress tracking.
      </div>
    );
  }

  const isPositiveOverall = (data.overall_delta || 0) > 0;

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            V{data.v1_version} vs V{data.v2_version} Improvement Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tracking actual score changes and parameter deltas post re-validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Overall Delta</span>
            <div className={`text-xl font-extrabold flex items-center justify-end gap-1 ${
              isPositiveOverall ? 'text-emerald-400' : (data.overall_delta || 0) < 0 ? 'text-rose-400' : 'text-slate-300'
            }`}>
              {isPositiveOverall ? <TrendingUp className="w-5 h-5" /> : (data.overall_delta || 0) < 0 ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
              {isPositiveOverall ? `+${data.overall_delta}` : data.overall_delta} pts
            </div>
          </div>
          <button
            onClick={fetchComparison}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh comparison"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium block mb-1">V{data.v1_version} Score</span>
          <span className="text-2xl font-bold text-slate-200">{Math.round(data.overall_score_v1 || 0)}</span>
        </div>
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
          <span className="text-xs text-indigo-300 font-medium block mb-1">V{data.v2_version} Score</span>
          <span className="text-2xl font-bold text-indigo-300">{Math.round(data.overall_score_v2 || 0)}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Change</span>
          <span className={`text-2xl font-bold ${isPositiveOverall ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositiveOverall ? `+${data.overall_delta}` : data.overall_delta}
          </span>
        </div>
      </div>

      {/* Parameter Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Parameter</th>
              <th className="py-3 px-3 text-center">V{data.v1_version} Score</th>
              <th className="py-3 px-3 text-center">V{data.v2_version} Score</th>
              <th className="py-3 px-3 text-center">Change</th>
              <th className="py-3 px-4">Associated Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.parameter_comparisons?.map((param) => {
              const deltaPos = param.delta > 0;
              const deltaNeg = param.delta < 0;
              return (
                <tr key={param.parameter} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-200 uppercase tracking-wider">
                    {param.parameter.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400 font-semibold">
                    {Math.round(param.v1_score)}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-white">
                    {Math.round(param.v2_score)}
                  </td>
                  <td className="py-3 px-3 text-center font-extrabold">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs ${
                      deltaPos ? 'bg-emerald-500/10 text-emerald-400' : deltaNeg ? 'bg-rose-500/10 text-rose-400' : 'text-slate-500'
                    }`}>
                      {deltaPos ? `+${param.delta}` : param.delta}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 leading-relaxed">
                    {param.associated_change}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
