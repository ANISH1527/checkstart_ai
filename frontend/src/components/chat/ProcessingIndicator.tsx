import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const STAGES = [
  'Understanding problem & target customer',
  'Analyzing technology & solution feasibility',
  'Checking competitive signals & duplicate index',
  'Executing deterministic validation rules',
  'Calculating 9-parameter weighted score',
  'Calibrating assessment confidence level',
  'Detecting information gaps & actionable next steps'
];

export const ProcessingIndicator: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl my-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">AI Validation Pipeline Running</h4>
          <p className="text-xs text-slate-400">Processing submission through multi-stage NLP & LLM scoring</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {STAGES.map((stage, idx) => (
          <div key={idx} className="flex items-center gap-2.5 text-xs">
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
            <span className="text-slate-300 font-medium">{stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
