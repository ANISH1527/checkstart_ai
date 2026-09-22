import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import type { ValidationHistoryItem } from '../../types/validation';

interface HistoryChartProps {
  history: ValidationHistoryItem[];
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
  const data = history.map((item) => ({
    version: `v${item.version}`,
    score: item.overall_score,
    confidence: item.confidence_score,
  }));

  return (
    <div className="w-full h-64 bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
        Validation Score Progress Across Iterations
      </h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="version" stroke="#64748b" fontSize={12} />
          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.5rem',
              color: '#f8fafc',
              fontSize: '12px'
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            name="Overall Score"
            stroke="#06b6d4"
            strokeWidth={3}
            dot={{ r: 5, fill: '#06b6d4' }}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            name="Confidence %"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 4, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
