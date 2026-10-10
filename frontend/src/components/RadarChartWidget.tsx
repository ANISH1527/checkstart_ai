import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ParameterScores } from '../types';

interface RadarChartWidgetProps {
  scores: ParameterScores;
  height?: number;
}

export const RadarChartWidget: React.FC<RadarChartWidgetProps> = ({
  scores,
  height = 320,
}) => {
  const data = [
    { subject: 'Market Demand', value: scores.marketDemand ?? 5, fullMark: 10 },
    { subject: 'Problem Severity', value: scores.problemSeverity ?? 5, fullMark: 10 },
    { subject: 'Competition Moat', value: scores.competition ?? 5, fullMark: 10 },
    { subject: 'Target Customer', value: scores.targetCustomer ?? 5, fullMark: 10 },
    { subject: 'Innovation', value: scores.innovation ?? 5, fullMark: 10 },
    { subject: 'Feasibility', value: scores.feasibility ?? 5, fullMark: 10 },
    { subject: 'Revenue Potential', value: scores.revenuePotential ?? 5, fullMark: 10 },
  ];

  return (
    <div className="w-full flex items-center justify-center" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.3} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: any) => [`${value} / 10`, 'Score']}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              borderRadius: '12px',
              color: '#0f172a',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
          />
          <Radar
            name="Validation Parameters"
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.45}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
