import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AdminIdeaItem } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Lightbulb,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Loader2,
  Calendar,
  User as UserIcon,
} from 'lucide-react';

export const AdminIdeasPage: React.FC = () => {
  const [ideas, setIdeas] = useState<AdminIdeaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminIdeas({ search, category, sort });
      setIdeas(res.ideas);
    } catch (err: any) {
      console.error('Failed to load admin ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [search, category, sort]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          All Submitted Startup Ideas
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Complete inventory of all student startup ideas across universities.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by idea name, founder, domain..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Highly Promising">Highly Promising (80%+)</option>
              <option value="Promising">Promising (60-79%)</option>
              <option value="Needs Improvement">Needs Improvement (40-59%)</option>
              <option value="High Risk">High Risk (&lt;40%)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="highest-score">Highest Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ideas Table */}
      <div className="overflow-x-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
            <p className="text-xs text-slate-400">Loading startup ideas...</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No startup ideas found matching the criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Startup Concept</th>
                <th className="py-3.5 px-4">Student Founder</th>
                <th className="py-3.5 px-4">Industry</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {ideas.map((item) => {
                const report = item.latestReport;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-4 px-4 font-bold text-white">
                      {item.name}
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        to={`/admin/users/${item.user.id}`}
                        className="hover:text-purple-400 transition"
                      >
                        <p className="font-bold text-slate-200">{item.user.name}</p>
                        <p className="text-[11px] text-slate-400">{item.user.college || item.user.email}</p>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {item.industry}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-purple-400">
                      {report ? `${report.validationPercentage}%` : '—'}
                    </td>
                    <td className="py-4 px-4">
                      {report ? (
                        <StatusBadge category={report.validationCategory} size="sm" />
                      ) : (
                        <span className="text-slate-500">Unanalyzed</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
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
        )}
      </div>
    </div>
  );
};
