import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react';

const RecommendationCard = ({ rec, onToggleComplete, index }) => {
  const [showWhy, setShowWhy] = useState(false);

  const isCompleted = rec.status === 'COMPLETED';

  const getPriorityBadge = (priority) => {
    const p = (priority || 'MEDIUM').toUpperCase();
    switch (p) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatParam = (str) => {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-200 mb-4 ${
        isCompleted
          ? 'bg-gray-50/70 border-gray-200 opacity-75'
          : 'bg-white border-gray-200/80 shadow-xs hover:shadow-md'
      }`}
    >
      <div className="flex items-start space-x-3.5">
        {/* Checkbox Toggle */}
        <button
          onClick={() => onToggleComplete && onToggleComplete(rec.id || rec.rec_id)}
          className="mt-0.5 text-gray-400 hover:text-emerald-600 focus:outline-none transition"
          aria-label={isCompleted ? 'Mark open' : 'Mark complete'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          ) : (
            <Circle className="w-5 h-5 hover:text-indigo-600" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Header Row: Priority + Parameter */}
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            {index !== undefined && (
              <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
            )}
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                rec.priority
              )}`}
            >
              {rec.priority || 'RECOMMENDED'}
            </span>
            {rec.parameter && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {formatParam(rec.parameter)}
              </span>
            )}
          </div>

          {/* Action Title */}
          <h4
            className={`text-base font-bold leading-snug text-gray-900 ${
              isCompleted ? 'line-through text-gray-500' : ''
            }`}
          >
            {rec.action}
          </h4>

          {/* Collapsible "Why it matters" */}
          {rec.why_it_matters && (
            <div className="mt-2">
              <button
                onClick={() => setShowWhy(!showWhy)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center space-x-1 focus:outline-none"
              >
                <span>{showWhy ? 'Hide detail' : 'Why it matters'}</span>
                {showWhy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showWhy && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                  {rec.why_it_matters}
                </div>
              )}
            </div>
          )}

          {/* Validation Method */}
          {(rec.validation_method || rec.success_metric) && (
            <p className="text-xs text-gray-500 italic mt-2">
              <span className="font-semibold text-gray-700">Validation method: </span>
              {rec.validation_method || rec.success_metric}
            </p>
          )}

          {/* Expected Impact */}
          {rec.expected_impact && (
            <p className="text-xs text-emerald-700 font-medium mt-1">
              ✨ <span className="font-semibold">Expected Impact: </span>
              {rec.expected_impact}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
