import React, { useState } from 'react';

const ParameterBar = ({ name, score, reason }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const formatName = (str) => {
    if (!str) return '';
    return str
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getBarColor = (s) => {
    if (s >= 70) return 'bg-emerald-500';
    if (s >= 55) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTooltipText = (s) => {
    if (s >= 80) return 'Strong — this dimension is well-defined';
    if (s >= 60) return 'Average — could be improved with more detail';
    return 'Weak — needs attention, see action plan';
  };

  return (
    <div
      className="relative group mb-3.5"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Label and Score */}
      <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
        <span className="text-gray-700 font-semibold">{formatName(name)}</span>
        <span className="text-gray-900 font-bold">{score}/100</span>
      </div>

      {/* Progress Bar Track */}
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(score)}`}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>

      {/* Reason line if provided */}
      {reason && (
        <p className="text-[11px] text-gray-500 italic mt-1 leading-snug truncate">{reason}</p>
      )}

      {/* Hover Tooltip (Prompt 7) */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-30 pointer-events-none">
          <div className="bg-gray-900 text-white text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap">
            {getTooltipText(score)}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ParameterBar;
