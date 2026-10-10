import React from 'react';
import { ParameterScores } from '../types';
import {
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Users,
  Lightbulb,
  Cpu,
  DollarSign,
} from 'lucide-react';

interface ParameterProgressProps {
  scores: ParameterScores;
}

interface ParamMeta {
  key: keyof ParameterScores;
  name: string;
  weight: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const PARAMETERS: ParamMeta[] = [
  {
    key: 'marketDemand',
    name: 'Market Demand',
    weight: '25%',
    icon: TrendingUp,
    description: 'TAM/SAM expansion rate and organic market appetite',
  },
  {
    key: 'problemSeverity',
    name: 'Problem Severity',
    weight: '20%',
    icon: AlertCircle,
    description: 'Pain point urgency, frequency, and willingness to solve',
  },
  {
    key: 'competition',
    name: 'Competition Advantage',
    weight: '15%',
    icon: ShieldCheck,
    description: 'Market white space (10 = Low competition/Unsaturated)',
  },
  {
    key: 'targetCustomer',
    name: 'Target Customer Clarity',
    weight: '10%',
    icon: Users,
    description: 'ICP specificity, reachability, and feedback loop ease',
  },
  {
    key: 'innovation',
    name: 'Innovation & USP',
    weight: '10%',
    icon: Lightbulb,
    description: 'Defensibility, technology differentiation, and moat',
  },
  {
    key: 'feasibility',
    name: 'Student Feasibility',
    weight: '10%',
    icon: Cpu,
    description: 'MVP development complexity, skill requirements, and speed',
  },
  {
    key: 'revenuePotential',
    name: 'Revenue Potential',
    weight: '10%',
    icon: DollarSign,
    description: 'Monetization viability, unit economics, and pricing power',
  },
];

export const ParameterProgress: React.FC<ParameterProgressProps> = ({ scores }) => {
  const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'bg-emerald-500 text-emerald-600';
    if (score >= 6.0) return 'bg-blue-500 text-blue-600';
    if (score >= 4.0) return 'bg-amber-500 text-amber-600';
    return 'bg-rose-500 text-rose-600';
  };

  return (
    <div className="space-y-4">
      {PARAMETERS.map((param) => {
        const val = scores[param.key] ?? 5.0;
        const percentage = Math.min(100, Math.max(0, val * 10));
        const colorClass = getScoreColor(val);
        const Icon = param.icon;

        return (
          <div
            key={param.key}
            className="p-3.5 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-600"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-dark-input text-slate-700 dark:text-dark-text">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-dark-text">
                      {param.name}
                    </h4>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-dark-input text-slate-600 dark:text-dark-muted border border-slate-200 dark:border-dark-border">
                      Weight: {param.weight}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-dark-muted">
                    {param.description}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className={`text-base font-bold ${colorClass.split(' ')[1]}`}>
                  {val.toFixed(1)}
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">/10</span>
                </span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full bg-slate-100 dark:bg-dark-input h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass.split(' ')[0]}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
