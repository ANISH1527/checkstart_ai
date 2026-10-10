import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { DashboardStats } from '../types';

interface ScoreHistoryChartProps {
  data: DashboardStats['scoreHistory'];
  height?: number;
}

export const ScoreHistoryChart: React.FC<ScoreHistoryChartProps> = ({
  data,
  height = 260,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
        <p>No validation history yet.</p>
        <p className="text-xs text-slate-400 mt-1">
          Validate your first startup idea to see trends.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-900 dark:text-dark-text px-3 py-2 rounded-xl shadow-lg text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.fullName}</p>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                      Score: {item.score}%
                    </p>
                    <p className="text-slate-500 dark:text-dark-muted text-[11px]">
                      Category: {item.category}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          {/* Promising benchmark threshold */}
          <ReferenceLine
            y={80}
            stroke="#10b981"
            strokeDasharray="3 3"
            label={{ value: 'Highly Promising (80%)', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }}
          />
          <ReferenceLine
            y={60}
            stroke="#3b82f6"
            strokeDasharray="3 3"
            label={{ value: 'Promising (60%)', fill: '#3b82f6', fontSize: 10, position: 'insideTopRight' }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 7, fill: '#6366f1' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
