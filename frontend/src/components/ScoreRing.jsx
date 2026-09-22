import React, { useEffect, useState } from 'react';

const ScoreRing = ({ score = 0, size = 130, strokeWidth = 10 }) => {
  const [offset, setOffset] = useState(0);
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const progress = Math.min(Math.max(score, 0), 100) / 100;
    const progressOffset = circumference - progress * circumference;
    setOffset(progressOffset);
  }, [score, circumference]);

  const getColor = (s) => {
    if (s >= 80) return '#059669'; // Emerald
    if (s >= 70) return '#4f46e5'; // Indigo
    if (s >= 55) return '#d97706'; // Amber
    return '#dc2626'; // Red
  };

  const strokeColor = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Fill Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center Text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black text-gray-900 tracking-tight">{Math.round(score)}</span>
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">out of 100</span>
      </div>
    </div>
  );
};

export default ScoreRing;
