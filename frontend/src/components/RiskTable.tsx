import React from 'react';
import { RiskItem } from '../types';
import { ShieldAlert } from 'lucide-react';

interface RiskTableProps {
  risks: RiskItem[];
}

export const RiskTable: React.FC<RiskTableProps> = ({ risks }) => {
  if (!risks || risks.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500 dark:text-dark-muted bg-slate-50 dark:bg-dark-input rounded-xl border border-slate-200 dark:border-dark-border">
        No critical risks flagged for this venture model.
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            High Severity
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Medium Severity
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Low Severity
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-dark-input text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-muted border-b border-slate-200 dark:border-dark-border">
          <tr>
            <th className="py-3 px-4">Identified Risk</th>
            <th className="py-3 px-4 w-36">Severity</th>
            <th className="py-3 px-4">Strategic Mitigation Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
          {risks.map((item, index) => (
            <tr
              key={index}
              className="hover:bg-slate-50/70 dark:hover:bg-dark-hover/60 transition-colors"
            >
              <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-dark-text flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                <span>{item.risk}</span>
              </td>
              <td className="py-3.5 px-4">
                {getSeverityBadge(item.severity)}
              </td>
              <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                {item.mitigation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
