import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AdminDashboardStats } from '../../types';
import {
  Users,
  Lightbulb,
  FileCheck2,
  TrendingUp,
  Award,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await api.getAdminDashboardStats();
        setStats(res.stats);
      } catch (err: any) {
        console.error('Failed to load admin stats:', err);
        setError(err.message || 'Unable to retrieve administrative statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading platform-wide administrative analytics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300">
        <p className="font-bold">Error loading admin dashboard</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 border border-purple-900/50 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Administration & Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Platform Governance Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Real-time telemetry on collegiate founder signups, submitted ideas, AI validations, and category viability across all universities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/users"
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </Link>
            <Link
              to="/admin/ideas"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
            >
              <Lightbulb className="w-4 h-4" />
              <span>View All Ideas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Users */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Registered Founders
            </p>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {stats.totalUsers}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <span>+{stats.newUsersToday} joined today</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-950/60 text-purple-400 flex items-center justify-center border border-purple-800/40">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Ideas */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Startup Ideas
            </p>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {stats.totalIdeas}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Across all student domains</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 text-indigo-400 flex items-center justify-center border border-indigo-800/40">
            <Lightbulb className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Validations */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Validations
            </p>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {stats.totalValidations}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <span>+{stats.newValidationsToday} generated today</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-950/60 text-blue-400 flex items-center justify-center border border-blue-800/40">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Platform Average Score */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Platform Avg Score
            </p>
            <h3 className="text-3xl font-extrabold text-purple-400 mt-1">
              {stats.averageValidationScore}%
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">7-Parameter weighted mean</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4 Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-center">
          <span className="text-xs font-semibold text-emerald-300 uppercase">Highly Promising</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.categories.highlyPromising}</p>
          <span className="text-[10px] text-slate-400">80–100% viability</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/60 text-center">
          <span className="text-xs font-semibold text-blue-300 uppercase">Promising</span>
          <p className="text-2xl font-extrabold text-blue-400 mt-1">{stats.categories.promising}</p>
          <span className="text-[10px] text-slate-400">60–79% viability</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-center">
          <span className="text-xs font-semibold text-amber-300 uppercase">Needs Improvement</span>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{stats.categories.needsImprovement}</p>
          <span className="text-[10px] text-slate-400">40–59% viability</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/60 text-center">
          <span className="text-xs font-semibold text-rose-300 uppercase">High Risk</span>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">{stats.categories.highRisk}</p>
          <span className="text-[10px] text-slate-400">&lt;40% viability</span>
        </div>
      </div>

      {/* Platform Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Validation Category Distribution (Donut / Pie) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-white mb-2">
            Validation Category Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Percentage breakdown of venture classifications across all submissions
          </p>

          <div className="w-full h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Score Distribution (Histogram) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-white mb-2">
            Validation Score Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Frequency distribution of overall scores across 20% buckets
          </p>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Idea Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: User Growth Timeline */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-white mb-2">
            Founder Registration Growth
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Cumulative growth of registered student entrepreneurs over time
          </p>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0284c7' }}
                  name="Cumulative Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Validation Activity Timeline */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-white mb-2">
            Validation Activity Timeline
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Daily volume of AI evaluations executed
          </p>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.validationActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="validations" fill="#10b981" radius={[6, 6, 0, 0]} name="Reports Generated" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
