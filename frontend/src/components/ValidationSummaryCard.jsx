import React, { useState } from 'react';
import { Info, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import ScoreRing from './ScoreRing';

const ValidationSummaryCard = ({ validation }) => {
  const [showConfTooltip, setShowConfTooltip] = useState(false);

  if (!validation) return null;

  const getClassificationBadge = (cls) => {
    const c = (cls || 'MODERATE').toUpperCase();
    switch (c) {
      case 'EXCEPTIONAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'STRONG':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'WEAK':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'VERY_WEAK':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const confidenceScore = validation.confidence_score || validation.confidence || 75;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs mb-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center space-x-3 mb-2">
            <span
              className={`text-xs font-black px-3.5 py-1 rounded-full border uppercase tracking-wider ${getClassificationBadge(
                validation.classification
              )}`}
            >
              {validation.classification || 'VALIDATED'}
            </span>

            {/* Confidence Score with Info Tooltip (Prompt 7) */}
            <div className="relative inline-flex items-center">
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
                <span>{Math.round(confidenceScore)}% Confidence</span>
                <button
                  onMouseEnter={() => setShowConfTooltip(true)}
                  onMouseLeave={() => setShowConfTooltip(false)}
                  className="text-gray-400 hover:text-indigo-600 focus:outline-none ml-1"
                  aria-label="Confidence Info"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </span>

              {showConfTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl z-30 pointer-events-none leading-relaxed">
                  Confidence reflects how complete your idea description is. A higher confidence means our analysis is based on more concrete information. Add missing details to improve it.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Validation Summary</h3>
          <p className="text-xs text-gray-500 mt-1">
            Evaluated against 9 business parameters using our 15-layer AI engine.
          </p>
        </div>

        {/* Animated Score Ring */}
        <div className="flex-shrink-0">
          <ScoreRing score={validation.overall_score || 0} size={120} strokeWidth={9} />
        </div>
      </div>

      {/* Strengths, Weaknesses, Risks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Strengths */}
        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Key Strengths</span>
          </div>
          <ul className="space-y-1.5 text-xs text-gray-700">
            {validation.strengths && validation.strengths.length > 0 ? (
              validation.strengths.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 italic">No major strengths highlighted yet.</li>
            )}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Weaknesses</span>
          </div>
          <ul className="space-y-1.5 text-xs text-gray-700">
            {validation.weaknesses && validation.weaknesses.length > 0 ? (
              validation.weaknesses.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 italic">No critical weaknesses detected.</li>
            )}
          </ul>
        </div>

        {/* Risks */}
        <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
          <div className="flex items-center space-x-2 text-red-800 font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Key Risks</span>
          </div>
          <ul className="space-y-1.5 text-xs text-gray-700">
            {validation.risks && validation.risks.length > 0 ? (
              validation.risks.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-red-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 italic">Standard market execution risks.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ValidationSummaryCard;
