import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  ideaName?: string;
  message?: string;
  onComplete?: () => void;
}

const STAGES = [
  'Understanding your startup problem & concept...',
  'Evaluating market demand & audience scale...',
  'Analyzing the problem severity & pain points...',
  'Evaluating competitive landscape & differentiation moats...',
  'Checking student engineering feasibility & MVP requirements...',
  'Estimating revenue potential & unit economics...',
  'Synthesizing 7-parameter weighted scores & recommendations...',
];

export const LoadingState: React.FC<LoadingStateProps> = ({ ideaName, message }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 max-w-xl mx-auto text-center">
      {/* Animated Glowing Orb */}
      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-40 animate-pulse" />
        <div className="relative w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl">
          <Sparkles className="w-10 h-10 animate-spin text-indigo-200" style={{ animationDuration: '6s' }} />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-dark-text tracking-tight mb-2">
        {ideaName ? `Analyzing "${ideaName}"` : message || 'Analyzing Your Startup Idea'}
      </h2>
      <p className="text-sm text-slate-500 dark:text-dark-muted mb-8 max-w-md">
        Our multi-dimensional AI validation engine is evaluating your venture against the 7-parameter startup framework.
      </p>

      {/* Checklist Progress */}
      <div className="w-full bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-md text-left space-y-3.5">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isPending = idx > currentStageIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                isDone
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : isCurrent
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-[1.01]'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {isDone && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 dark:text-emerald-400 animate-fade-in" />}
              {isCurrent && <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin text-indigo-600 dark:text-indigo-400" />}
              {isPending && <Circle className="w-5 h-5 flex-shrink-0 text-slate-300 dark:text-slate-600" />}
              <span>{stage}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
