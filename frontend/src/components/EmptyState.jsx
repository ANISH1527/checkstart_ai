import React from 'react';
import { Lightbulb } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Lightbulb,
  title = "You haven't added any ideas yet",
  subtitle = "Start by describing your startup idea. Our AI will analyze it and tell you exactly what's working and what needs fixing.",
  actionLabel = "Add my first idea →",
  onAction,
}) => {
  return (
    <div className="bg-white rounded-2xl p-10 sm:p-14 text-center border border-gray-200/80 shadow-xs max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
        <Icon className="w-8 h-8" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">{subtitle}</p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition active:scale-95 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
