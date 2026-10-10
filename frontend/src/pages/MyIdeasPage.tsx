import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { StartupIdea, VersionReportItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import {
  Search,
  PlusCircle,
  Trash2,
  ExternalLink,
  Calendar,
  Building,
  Sparkles,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  Filter,
  MessageSquare,
  History,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';

export const MyIdeasPage: React.FC = () => {
  const navigate = useNavigate();

  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedIdeaForDelete, setSelectedIdeaForDelete] = useState<StartupIdea | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Version History Modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedIdeaForHistory, setSelectedIdeaForHistory] = useState<StartupIdea | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionReports, setVersionReports] = useState<VersionReportItem[]>([]);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      const res = await api.getIdeas({ search, category, sort });
      setIdeas(res.ideas);
    } catch (err: any) {
      console.error('Failed to load ideas:', err);
      setError(err.message || 'Unable to load your startup ideas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [search, category, sort]);

  const handleDeleteConfirm = async () => {
    if (!selectedIdeaForDelete) return;
    try {
      setDeleting(true);
      await api.deleteIdea(selectedIdeaForDelete.id);
      setDeleteModalOpen(false);
      setSelectedIdeaForDelete(null);
      fetchIdeas();
    } catch (err: any) {
      console.error('Failed to delete idea:', err);
      alert('Failed to delete startup idea.');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenVersionHistory = async (idea: StartupIdea) => {
    setSelectedIdeaForHistory(idea);
    setHistoryModalOpen(true);
    setVersionsLoading(true);

    try {
      const res = await api.getIdeaReports(idea.id);
      setVersionReports(res.reports || []);
    } catch (err) {
      console.error('Failed to fetch idea reports:', err);
      setVersionReports([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-dark-text tracking-tight">
            My Startup Ideas
          </h1>
          <p className="text-sm text-slate-500 dark:text-dark-muted mt-1">
            Manage, review, and track versioned improvements for your evaluated concepts.
          </p>
        </div>

        <Link
          to="/validate"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Validate New Idea</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by idea name, industry, keywords..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-input text-xs text-slate-900 dark:text-dark-text focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-dark-input transition"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-input px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-dark-text font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All" className="dark:bg-dark-card">All Categories</option>
              <option value="Highly Promising" className="dark:bg-dark-card">Highly Promising (80%+)</option>
              <option value="Promising" className="dark:bg-dark-card">Promising (60-79%)</option>
              <option value="Needs Improvement" className="dark:bg-dark-card">Needs Improvement (40-59%)</option>
              <option value="High Risk" className="dark:bg-dark-card">High Risk (&lt;40%)</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-input px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-dark-text font-semibold focus:outline-none cursor-pointer"
            >
              <option value="newest" className="dark:bg-dark-card">Newest First</option>
              <option value="oldest" className="dark:bg-dark-card">Oldest First</option>
              <option value="highest-score" className="dark:bg-dark-card">Highest Score</option>
              <option value="lowest-score" className="dark:bg-dark-card">Lowest Score</option>
            </select>
          </div>

          {/* Grid/Table Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-dark-input rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-dark-card text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-dark-text'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-dark-card text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-dark-text'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs text-slate-500 dark:text-dark-muted">Retrieving ideas...</p>
        </div>
      ) : ideas.length === 0 ? (
        <EmptyState
          title="No startup ideas found."
          description={
            search || category !== 'All'
              ? 'No ideas match your current search and filter criteria.'
              : 'You haven’t created any startup validations yet. Start by analyzing your first idea.'
          }
          actionText="+ Validate Startup Idea"
          actionHref="/validate"
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => {
            const report = idea.latestReport;
            const reportsCount = idea.reportsCount || 0;

            return (
              <div
                key={idea.id}
                className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {idea.industry}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {reportsCount > 1 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          v{report?.versionNumber || reportsCount}
                        </span>
                      )}
                      {report && <StatusBadge category={report.validationCategory} size="sm" />}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text line-clamp-1">
                    {idea.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-dark-muted line-clamp-2 mt-1.5 leading-relaxed">
                    {idea.description}
                  </p>
                </div>

                {/* Score & Meta */}
                <div className="pt-4 border-t border-slate-100 dark:border-dark-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Score</p>
                      <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        {report ? `${report.validationPercentage}%` : 'Pending'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(idea.updatedAt || idea.createdAt).toLocaleDateString()}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-dark-muted font-medium">
                        {reportsCount > 0
                          ? `${reportsCount} ${reportsCount === 1 ? 'version' : 'versions'}`
                          : idea.currentStage}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Continue Conversation, View Latest, Version History */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      {/* 1. Continue Conversation */}
                      <Link
                        to={
                          idea.conversationId
                            ? `/validate?conversationId=${idea.conversationId}`
                            : '/validate'
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Continue Chat</span>
                      </Link>

                      {/* 2. View Latest Report */}
                      {report && (
                        <Link
                          to={`/report/${report.id}`}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-dark-input hover:bg-slate-200 dark:hover:bg-dark-hover text-slate-700 dark:text-dark-text font-bold text-xs transition"
                          title="View Latest Report"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Report</span>
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {/* 3. View Version History */}
                      {reportsCount > 0 ? (
                        <button
                          onClick={() => handleOpenVersionHistory(idea)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-dark-muted text-xs font-semibold transition"
                        >
                          <History className="w-3 h-3" />
                          <span>Version History ({reportsCount})</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Not validated yet</span>
                      )}

                      {/* 4. Delete */}
                      <button
                        onClick={() => {
                          setSelectedIdeaForDelete(idea);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                        title="Delete idea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-input text-slate-400 dark:text-dark-muted font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Startup Idea</th>
                <th className="py-3.5 px-6">Industry</th>
                <th className="py-3.5 px-6">Score</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Versions</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {ideas.map((idea) => {
                const report = idea.latestReport;
                return (
                  <tr key={idea.id} className="hover:bg-slate-50/70 dark:hover:bg-dark-hover/60 transition">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 dark:text-dark-text text-sm">{idea.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-dark-muted truncate max-w-xs">{idea.problemStatement}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-dark-muted">{idea.industry}</td>
                    <td className="py-4 px-6">
                      {report ? (
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                          {report.validationPercentage}%
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {report ? (
                        <StatusBadge category={report.validationCategory} size="sm" />
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">Unanalyzed</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {idea.reportsCount && idea.reportsCount > 0 ? (
                        <button
                          onClick={() => handleOpenVersionHistory(idea)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <History className="w-3 h-3" />
                          <span>v{report?.versionNumber || idea.reportsCount} ({idea.reportsCount})</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={
                            idea.conversationId
                              ? `/validate?conversationId=${idea.conversationId}`
                              : '/validate'
                          }
                          className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition"
                          title="Continue Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>

                        {report && (
                          <Link
                            to={`/report/${report.id}`}
                            className="p-2 rounded-xl text-slate-600 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-hover transition"
                            title="View Report"
                          >
                            <Sparkles className="w-4 h-4" />
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            setSelectedIdeaForDelete(idea);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 transition"
                          title="Delete Idea"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Version History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setSelectedIdeaForHistory(null);
          setVersionReports([]);
        }}
        title={`Validation History — ${selectedIdeaForHistory?.name || 'Startup'}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-dark-muted">
            Track how your startup score improved across conversational iterations and revalidations.
          </p>

          {versionsLoading ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs text-slate-400 dark:text-slate-500">Loading version history...</p>
            </div>
          ) : versionReports.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No previous versions found.</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {versionReports.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-input border border-slate-200 dark:border-dark-border flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-dark-text">
                        Version {v.versionNumber}
                      </span>
                      <StatusBadge category={v.validationCategory} size="sm" />
                      {v.scoreDelta !== null && v.scoreDelta !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            v.scoreDelta >= 0
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {v.scoreDelta >= 0 ? `+${v.scoreDelta}%` : `${v.scoreDelta}%`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-dark-muted mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(v.createdAt).toLocaleString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                      {v.validationPercentage}%
                    </span>
                    <button
                      onClick={() => {
                        setHistoryModalOpen(false);
                        navigate(`/report/${v.id}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setHistoryModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-dark-input text-slate-700 dark:text-dark-text text-xs font-semibold hover:bg-slate-200 dark:hover:bg-dark-hover transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Startup Idea"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <span className="font-bold text-slate-900 dark:text-dark-text">
              {selectedIdeaForDelete?.name}
            </span>
            ? All associated validation reports, history versions, and AI analyses will be removed.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-dark-input text-slate-700 dark:text-dark-text text-xs font-semibold hover:bg-slate-200 dark:hover:bg-dark-hover transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
