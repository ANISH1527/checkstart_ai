import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StartupIdea, ComparisonResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  GitCompare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

export const CompareIdeasPage: React.FC = () => {
  const [allIdeas, setAllIdeas] = useState<StartupIdea[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        const res = await api.getIdeas();
        const validatedIdeas = res.ideas.filter((i) => i.latestReport !== null);
        setAllIdeas(validatedIdeas);

        // Pre-select top 2 ideas if available
        if (validatedIdeas.length >= 2) {
          const initialIds = [validatedIdeas[0].id, validatedIdeas[1].id];
          setSelectedIds(initialIds);
          runComparison(initialIds);
        }
      } catch (err: any) {
        console.error('Failed to load ideas for comparison:', err);
        setError(err.message || 'Unable to load startup ideas.');
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, []);

  const runComparison = async (ids: string[]) => {
    if (ids.length < 2) return;
    try {
      setComparing(true);
      setError(null);
      const res = await api.compareIdeas(ids);
      setComparisonResult(res);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message || 'Failed to generate comparison analysis.');
    } finally {
      setComparing(false);
    }
  };

  const handleToggleIdea = (ideaId: string) => {
    let updated: string[];
    if (selectedIds.includes(ideaId)) {
      if (selectedIds.length <= 2) {
        alert('Please keep at least 2 ideas selected for comparison.');
        return;
      }
      updated = selectedIds.filter((id) => id !== ideaId);
    } else {
      if (selectedIds.length >= 4) {
        alert('You can compare a maximum of 4 startup ideas simultaneously.');
        return;
      }
      updated = [...selectedIds, ideaId];
    }
    setSelectedIds(updated);
    runComparison(updated);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Preparing comparative metrics...</p>
      </div>
    );
  }

  if (allIdeas.length < 2) {
    return (
      <div className="max-w-xl mx-auto text-center p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
          <GitCompare className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-dark-text">
          Need at least 2 Validated Ideas
        </h2>
        <p className="text-xs text-slate-500 dark:text-dark-muted leading-relaxed">
          You currently have {allIdeas.length} validated startup idea. Please submit and validate at least 2 startup ideas to view comparative radar charts and AI synthesis.
        </p>
      </div>
    );
  }

  // Prepare Bar Chart & Radar Chart Data
  const paramNames = [
    { key: 'marketDemand', label: 'Market Demand (25%)' },
    { key: 'problemSeverity', label: 'Problem Severity (20%)' },
    { key: 'competition', label: 'Competition Moat (15%)' },
    { key: 'targetCustomer', label: 'Target Customer (10%)' },
    { key: 'innovation', label: 'Innovation (10%)' },
    { key: 'feasibility', label: 'Feasibility (10%)' },
    { key: 'revenuePotential', label: 'Revenue Potential (10%)' },
  ];

  const barChartData = paramNames.map((p) => {
    const row: any = { parameter: p.label };
    comparisonResult?.ideas.forEach((idea) => {
      row[idea.name] = (idea.scores as any)?.[p.key] ?? 0;
    });
    return row;
  });

  const radarChartData = [
    { subject: 'Market Demand', fullMark: 10 },
    { subject: 'Problem Severity', fullMark: 10 },
    { subject: 'Competition Moat', fullMark: 10 },
    { subject: 'Target Customer', fullMark: 10 },
    { subject: 'Innovation', fullMark: 10 },
    { subject: 'Feasibility', fullMark: 10 },
    { subject: 'Revenue Potential', fullMark: 10 },
  ].map((item, idx) => {
    const key = paramNames[idx].key;
    const point: any = { subject: item.subject, fullMark: 10 };
    comparisonResult?.ideas.forEach((idea) => {
      point[idea.name] = (idea.scores as any)?.[key] ?? 0;
    });
    return point;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-dark-text tracking-tight">
          Compare Startup Ideas
        </h1>
        <p className="text-sm text-slate-500 dark:text-dark-muted mt-1">
          Select 2 to 4 validated ventures to compare multi-axial parameters, revenue potential, and AI rankings.
        </p>
      </div>

      {/* Idea Selector Chips */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
          Select Ideas to Compare ({selectedIds.length}/4 selected):
        </p>
        <div className="flex flex-wrap gap-2.5">
          {allIdeas.map((idea) => {
            const isSelected = selectedIds.includes(idea.id);
            return (
              <button
                key={idea.id}
                type="button"
                onClick={() => handleToggleIdea(idea.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-dark-input text-slate-700 dark:text-dark-text border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{idea.name}</span>
                <span className="text-[11px] opacity-85">
                  ({idea.latestReport?.validationPercentage}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {comparing ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs text-slate-500 dark:text-dark-muted">Synthesizing multi-idea comparative analysis...</p>
        </div>
      ) : comparisonResult ? (
        <div className="space-y-8">
          {/* AI Comparison Summary Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 text-slate-900 dark:text-dark-text shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>AI Comparative Synthesis</span>
            </div>
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {comparisonResult.comparisonSummary}
            </p>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-dark-text">
              7-Parameter Comparative Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-dark-input text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-muted border-b border-slate-200 dark:border-dark-border">
                  <tr>
                    <th className="py-3 px-4 w-48">Parameter</th>
                    {comparisonResult.ideas.map((idea, i) => (
                      <th key={idea.id} className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="font-bold text-slate-900 dark:text-dark-text">{idea.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
                  {/* Overall Score */}
                  <tr className="bg-indigo-50/50 dark:bg-indigo-950/30 font-bold">
                    <td className="py-3.5 px-4 text-indigo-900 dark:text-indigo-200">
                      Overall Validation Score
                    </td>
                    {comparisonResult.ideas.map((idea) => (
                      <td key={idea.id} className="py-3.5 px-4 font-extrabold text-base text-indigo-600 dark:text-indigo-400">
                        {idea.scores?.validationPercentage}%
                        <div className="mt-1">
                          <StatusBadge category={idea.scores?.validationCategory || 'Promising'} size="sm" />
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* 7 Parameters */}
                  {paramNames.map((param) => (
                    <tr key={param.key} className="hover:bg-slate-50/80 dark:hover:bg-dark-hover/60">
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-dark-muted">
                        {param.label}
                      </td>
                      {comparisonResult.ideas.map((idea) => {
                        const score = (idea.scores as any)?.[param.key] ?? 0;
                        return (
                          <td key={idea.id} className="py-3 px-4 font-bold text-slate-900 dark:text-dark-text">
                            {score.toFixed(1)} / 10
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Strategic Directive */}
                  <tr className="bg-slate-50/60 dark:bg-dark-input/60">
                    <td className="py-3 px-4 font-medium text-slate-600 dark:text-dark-muted">
                      Strategic Directive
                    </td>
                    {comparisonResult.ideas.map((idea) => (
                      <td key={idea.id} className="py-3 px-4 font-semibold text-xs text-indigo-600 dark:text-indigo-400">
                        {idea.recommendedAction}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Grouped Bar Chart */}
            <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 dark:text-dark-text mb-4">
                Comparative Parameter Scores (1-10)
              </h3>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
                    <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="parameter" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={110} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {comparisonResult.ideas.map((idea, i) => (
                      <Bar
                        key={idea.id}
                        dataKey={idea.name}
                        fill={COLORS[i % COLORS.length]}
                        radius={[0, 4, 4, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overlaid Radar Chart */}
            <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 dark:text-dark-text mb-4">
                Multi-Axial Comparative Overlay
              </h3>
              <div className="w-full h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                    <PolarGrid stroke="#cbd5e1" opacity={0.5} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {comparisonResult.ideas.map((idea, i) => (
                      <Radar
                        key={idea.id}
                        name={idea.name}
                        dataKey={idea.name}
                        stroke={COLORS[i % COLORS.length]}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.25}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
