import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorState = ({
  message = "Failed to load data. Please check your connection and try again.",
  onRetry,
}) => {
  return (
    <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-8 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h4 className="text-base font-bold text-red-900 mb-1">Something went wrong</h4>
      <p className="text-sm text-red-700 mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
