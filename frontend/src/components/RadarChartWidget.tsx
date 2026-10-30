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
import { normaliseScore, formatScore } from '../utils/scoreUtils';

interface RadarChartWidgetProps {
  scores: ParameterScores;
  height?: number;
}

export const RadarChartWidget: React.FC<RadarChartWidgetProps> = ({
  scores,
  height = 320,
}) => {
  const getVal = (primaryKey: string, aliasKey?: string) => {
    const raw = (scores as any)?.[primaryKey] ?? (aliasKey ? (scores as any)?.[aliasKey] : undefined);
    return normaliseScore(raw) ?? 5.0;
  };

  const data = [
    { subject: 'Market Demand', value: getVal('marketDemand', 'market_demand'), fullMark: 10 },
    { subject: 'Problem Severity', value: getVal('problemSeverity', 'problem_solution_fit'), fullMark: 10 },
    { subject: 'Competition Moat', value: getVal('competition'), fullMark: 10 },
    { subject: 'Target Customer', value: getVal('targetCustomer', 'target_customer_clarity'), fullMark: 10 },
    { subject: 'Innovation', value: getVal('innovation', 'uniqueness_innovation'), fullMark: 10 },
    { subject: 'Feasibility', value: getVal('feasibility', 'technical_feasibility'), fullMark: 10 },
    { subject: 'Revenue Potential', value: getVal('revenuePotential', 'business_potential'), fullMark: 10 },
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
            formatter={(value: any) => [formatScore(value), 'Score']}
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
