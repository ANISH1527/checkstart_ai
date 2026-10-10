import React from 'react';

interface ScoreGaugeProps {
  score: number; // 0 - 100
  overallScore?: number; // 1.0 - 10.0
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  overallScore,
  size = 'lg',
}) => {
  const boundedScore = Math.min(100, Math.max(0, score));

  // Color calculation
  let strokeColor = '#10B981'; // emerald
  let textColor = 'text-emerald-600';
  if (boundedScore < 40) {
    strokeColor = '#F43F5E'; // rose
    textColor = 'text-rose-600';
  } else if (boundedScore < 60) {
    strokeColor = '#F59E0B'; // amber
    textColor = 'text-amber-600';
  } else if (boundedScore < 80) {
    strokeColor = '#3B82F6'; // blue
    textColor = 'text-blue-600';
  }

  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (boundedScore / 100) * circumference;

  const dimensions = {
    sm: { box: 100, r: 40, stroke: 7, text: 'text-xl', subtext: 'text-xs' },
    md: { box: 140, r: 56, stroke: 9, text: 'text-3xl', subtext: 'text-xs' },
    lg: { box: 180, r: radius, stroke: 12, text: 'text-5xl', subtext: 'text-sm' },
  };

  const dim = dimensions[size];
  const r = dim.r;
  const circ = 2 * Math.PI * r;
  const offset = circ - (boundedScore / 100) * circ;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={dim.box}
        height={dim.box}
        className="transform -rotate-90 origin-center"
      >
        <circle
          cx={dim.box / 2}
          cy={dim.box / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={dim.stroke}
          className="text-slate-200 dark:text-slate-700/80"
          fill="transparent"
        />
        <circle
          cx={dim.box / 2}
          cy={dim.box / 2}
          r={r}
          stroke={strokeColor}
          strokeWidth={dim.stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`font-extrabold tracking-tight ${dim.text} ${textColor}`}>
          {boundedScore.toFixed(0)}
          <span className="text-sm font-semibold opacity-70">/100</span>
        </span>
        {overallScore !== undefined && (
          <span className="text-xs font-medium text-slate-500 dark:text-dark-muted">
            {overallScore.toFixed(1)} / 10
          </span>
        )}
      </div>
    </div>
  );
};
