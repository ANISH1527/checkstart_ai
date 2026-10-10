import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { StatusBadge } from '../components/StatusBadge';
import { ScoreHistoryChart } from '../components/ScoreHistoryChart';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { UserAvatar } from '../components/UserAvatar';
import {
  Lightbulb,
  TrendingUp,
  Award,
  ArrowRight,
  Plus,
  BarChart3,
  Calendar,
  Sparkles,
  School,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  MessageSquare,
  FileCheck2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.getDashboardStats();
        setStats(res.stats);
      } catch (err: any) {
        console.error('Failed to load dashboard stats:', err);
        setError(err.message || 'Unable to retrieve dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <LoadingState message="Aggregating your startup validation history..." />;
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700">
        <p className="font-bold">Error loading dashboard</p>
        <p className="text-xs mt-1">{error || 'Please try refreshing the page.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Personalized Welcome Section */}
      <div className="bg-white dark:bg-dark-card rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-dark-border shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              src={user?.profileImage}
              name={user?.name || 'Student Founder'}
              size="lg"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-[11px] font-bold mb-1.5 text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Collegiate Founder Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-dark-text">
                {user?.name || 'Student Founder'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-muted mt-0.5">
                {user?.email}
              </p>
              {user?.college && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                  🎓 {user.college} {user.course ? `• ${user.course}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/validate"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-105"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              <span>Validate & Chat</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Ideas */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
              Startup Ideas
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-dark-text mt-1">
              {stats.totalIdeas}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-dark-muted mt-0.5">
              Unique venture concepts
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Lightbulb className="w-6 h-6" />
          </div>
        </div>

        {/* Total Validation Reports across versions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
              Validation Reports
            </p>
            <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.totalValidations}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-dark-muted mt-0.5">
              Across all versioned evaluations
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        {/* Active Conversations */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
              Active Chats
            </p>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.activeConversations || stats.totalIdeas}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-dark-muted mt-0.5">
              Saved validation sessions
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Average Validation Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
              Average Score
            </p>
            <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {stats.averageScore}%
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-dark-muted mt-0.5">
              Highest: {stats.highestScore ? `${stats.highestScore}%` : '—'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4 Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Highly Promising</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.categories.highlyPromising}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-dark-muted">Score 80–100%</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-center">
          <div className="flex items-center justify-center gap-1 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Promising</span>
          </div>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {stats.categories.promising}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-dark-muted">Score 60–79%</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-center">
          <div className="flex items-center justify-center gap-1 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Improvement</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {stats.categories.needsImprovement}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-dark-muted">Score 40–59%</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-center">
          <div className="flex items-center justify-center gap-1 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>High Risk</span>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {stats.categories.highRisk}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-dark-muted">Score &lt;40%</span>
        </div>
      </div>

      {/* 3. Validation Score History Progression Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm">
        <ScoreHistoryChart data={stats.scoreHistory} />
      </div>

      {/* 4. Recent Ideas & Validations */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text">
              Recent Startup Analyses
            </h3>
            <p className="text-xs text-slate-500 dark:text-dark-muted">
              Your latest evaluated startup ventures and versioned reports
            </p>
          </div>
          <Link
            to="/ideas"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({stats.totalIdeas})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentAnalyses.length === 0 ? (
          <EmptyState
            title="No startup ideas validated yet"
            description="Start a chat with your AI Assistant to discuss and validate your first collegiate venture idea."
            actionText="Validate First Idea"
            actionHref="/validate"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-dark-input text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-muted border-b border-slate-200 dark:border-dark-border">
                <tr>
                  <th className="py-3 px-4">Startup Idea</th>
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-4">Latest Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {stats.recentAnalyses.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-dark-hover/60 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-dark-text">
                      {item.name}
                    </td>
                    <td className="py-4 px-4 text-slate-500 dark:text-dark-muted">
                      {item.industry}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-indigo-600 dark:text-indigo-400">
                      {item.score}%
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge category={item.category} size="sm" />
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        v{item.versionNumber || 1}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/report/${item.reportId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition"
                      >
                        <span>View Report</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
