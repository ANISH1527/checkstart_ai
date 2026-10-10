import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AdminUserDetails } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ChevronLeft,
  School,
  BookOpen,
  Calendar,
  Clock,
  Mail,
  Layers,
  Award,
  TrendingUp,
  FileCheck2,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.getAdminUserDetails(id);
        setData(res);
      } catch (err: any) {
        console.error('Failed to load user details:', err);
        setError(err.message || 'Unable to retrieve user activity.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading user profile & ventures...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-center space-y-4">
        <p className="font-bold text-rose-300">User Not Found</p>
        <p className="text-xs text-rose-400">{error || 'This user account does not exist.'}</p>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
        >
          Return to Users Directory
        </Link>
      </div>
    );
  }

  const { user, stats, ideas } = data;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Back Button */}
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Users</span>
        </Link>
      </div>

      {/* User Header Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border border-purple-500/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800">
                  {user.authProvider}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Academic Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
              <School className="w-3.5 h-3.5 text-purple-400" />
              <span>College / University</span>
            </span>
            <p className="text-sm font-bold text-white">
              {user.college || 'Unspecified'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Major / Department</span>
            </span>
            <p className="text-sm font-bold text-white">
              {user.course || 'Unspecified'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Graduation Year</span>
            </span>
            <p className="text-sm font-bold text-white">
              {user.graduationYear || '2026'}
            </p>
          </div>
        </div>
      </div>

      {/* User Usage Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Ideas</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalIdeas}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 text-purple-400 flex items-center justify-center border border-purple-800/40">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Validations</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.totalValidations}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-950/60 text-blue-400 flex items-center justify-center border border-blue-800/40">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Score</p>
            <h3 className="text-2xl font-extrabold text-purple-400 mt-1">{stats.averageScore}%</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-950/60 text-indigo-400 flex items-center justify-center border border-indigo-800/40">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Highest Score</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.highestScore}%</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* User's Startup Ideas Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-white">
          Startup Ideas Submitted by {user.name}
        </h2>

        {ideas.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No ideas submitted by this student yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Startup Concept</th>
                  <th className="py-3.5 px-4">Industry</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {ideas.map((idea) => {
                  const report = idea.latestReport;
                  return (
                    <tr key={idea.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white">{idea.name}</td>
                      <td className="py-3.5 px-4 text-slate-400">{idea.industry}</td>
                      <td className="py-3.5 px-4 font-extrabold text-purple-400">
                        {report ? `${report.validationPercentage}%` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {report ? (
                          <StatusBadge category={report.validationCategory} size="sm" />
                        ) : (
                          <span className="text-slate-500">Unanalyzed</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {new Date(idea.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {report ? (
                          <Link
                            to={`/report/${report.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition"
                          >
                            <span>Open Report</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
