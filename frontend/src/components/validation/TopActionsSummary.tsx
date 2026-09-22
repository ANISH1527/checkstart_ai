import React from 'react';
import type { TopActionSummary } from '../../types/validation';
import { Target, Zap } from 'lucide-react';

interface TopActionsSummaryProps {
  topActions: TopActionSummary[];
}

export const TopActionsSummary: React.FC<TopActionsSummaryProps> = ({ topActions }) => {
  if (!topActions || topActions.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 p-6 border border-indigo-500/30 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-bold text-white tracking-tight">Top 3 Actions</h3>
      </div>
      <p className="text-xs text-indigo-300/80 mb-4 font-medium">
        These actions address the largest current information gaps in your idea profile.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topActions.map((act) => (
          <div key={act.rank} className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-300 font-bold text-xs px-2.5 py-1 rounded-bl-lg border-l border-b border-indigo-500/30">
              #{act.rank}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {act.parameter.replace(/_/g, ' ')}
              </span>
              <h4 className="font-semibold text-white text-sm mb-2 leading-snug">{act.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-3">{act.action}</p>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 bg-indigo-950/60 p-2 rounded-md border border-indigo-500/10">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{act.reason}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
