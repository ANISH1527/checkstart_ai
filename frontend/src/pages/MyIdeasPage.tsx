import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { VersionReportItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { IdeaCard, IdeaCardItem } from '../components/IdeaCard';
import { formatOverallScore } from '../utils/scoreUtils';
import {
  Search,
  PlusCircle,
  Trash2,
  Calendar,
  Sparkles,
  LayoutGrid,
  List,
  Loader2,
  ArrowUpDown,
  Filter,
  MessageSquare,
  History,
  Clock,
} from 'lucide-react';

export const MyIdeasPage: React.FC = () => {
  const navigate = useNavigate();

  const [ideas, setIdeas] = useState<IdeaCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedIdeaForDelete, setSelectedIdeaForDelete] = useState<IdeaCardItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Version History Modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedIdeaForHistory, setSelectedIdeaForHistory] = useState<IdeaCardItem | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionReports, setVersionReports] = useState<VersionReportItem[]>([]);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);

      // STEP 3: Call BOTH /ideas and /sessions and merge results
      const [ideasRes, sessionsRes] = await Promise.allSettled([
        api.get('/ideas'),
        api.get('/sessions'),
      ]);

      const rawIdeas =
        ideasRes.status === 'fulfilled'
          ? ideasRes.value?.items ||
            ideasRes.value?.ideas ||
            (Array.isArray(ideasRes.value) ? ideasRes.value : [])
          : [];
      const rawSessions =
        sessionsRes.status === 'fulfilled'
          ? sessionsRes.value?.items ||
            sessionsRes.value?.sessions ||
            sessionsRes.value?.conversations ||
            (Array.isArray(sessionsRes.value) ? sessionsRes.value : [])
          : [];

      // Debug logging (STEP 3 CASE C)
      console.log('My Ideas API response:', { ideas: rawIdeas, sessions: rawSessions });

      const ideasList: any[] = Array.isArray(rawIdeas) ? rawIdeas : [];
      const sessionsList: any[] = Array.isArray(rawSessions) ? rawSessions : [];

      // Deduplicate: collect existing idea IDs and conversation IDs
      const existingIdeaIds = new Set(ideasList.map((i: any) => String(i.id)));
      const existingConvIds = new Set(
        ideasList.map((i: any) => String(i.conversationId || '')).filter(Boolean)
      );

      const mappedIdeas: IdeaCardItem[] = ideasList.map((i: any) => {
        const rawScore =
          i.latestReport?.overallScore ?? i.overall_score ?? i.score;
        const scoreNum =
          rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore))
            ? Number(rawScore)
            : null;
        const scorePercent =
          scoreNum !== null
            ? scoreNum <= 10 && scoreNum > 0
              ? Math.round(scoreNum * 10)
              : Math.round(scoreNum)
            : i.latestReport?.validationPercentage ?? null;

        return {
          ...i,
          source: 'idea' as const,
          overall_score: scoreNum,
          score: scoreNum,
          scoreDisplay: scorePercent !== null ? `${scorePercent}%` : null,
          classification: i.latestReport?.validationCategory || i.classification || null,
        };
      });

      const mappedSessions: IdeaCardItem[] = sessionsList
        .filter((s: any) => {
          // Include sessions that have validation results, scores, extracted info, or messages
          const hasScore =
            s.validation_result ||
            (s.overall_score !== null && s.overall_score !== undefined) ||
            (s.latestScore !== null && s.latestScore !== undefined) ||
            s.latestReport;
          const hasTitle =
            s.title &&
            s.title !== 'New Startup Idea' &&
            s.title !== 'Untitled Idea';
          const hasProblem =
            s.extracted_context?.problemStatement ||
            s.extracted_context?.problem;
          const hasMessages =
            s.lastMessage || (s.reportsCount && s.reportsCount > 0);
          return hasScore || hasTitle || hasProblem || hasMessages;
        })
        .filter((s: any) => {
          // Deduplicate if already present as an idea
          if (s.ideaId && existingIdeaIds.has(String(s.ideaId))) return false;
          if (s.idea_id && existingIdeaIds.has(String(s.idea_id))) return false;
          if (existingConvIds.has(String(s.id))) return false;
          if (existingIdeaIds.has(String(s.id))) return false;
          return true;
        })
        .map((s: any) => {
          const valRes = s.validation_result;
          const rawScore =
            valRes?.overall_score ??
            s.overall_score ??
            s.latestScore ??
            s.latestReport?.overallScore;
          const scoreNum =
            rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore))
              ? Number(rawScore)
              : null;
          const scorePercent =
            scoreNum !== null
              ? scoreNum <= 10 && scoreNum > 0
                ? Math.round(scoreNum * 10)
                : Math.round(scoreNum)
              : null;

          const classification =
            valRes?.classification ||
            s.classification ||
            s.latestReport?.validationCategory ||
            (scorePercent !== null
              ? scorePercent >= 80
                ? 'Highly Promising'
                : scorePercent >= 60
                ? 'Promising'
                : scorePercent >= 40
                ? 'Needs Improvement'
                : 'High Risk'
              : null);

          const title =
            s.title &&
            s.title !== 'New Startup Idea' &&
            s.title !== 'Untitled Idea'
              ? s.title
              : s.extracted_context?.startupName ||
                s.extracted_context?.problem?.slice(0, 60) ||
                s.extracted_context?.problemStatement?.slice(0, 60) ||
                s.title ||
                'Untitled Idea';

          const problem =
            s.extracted_context?.problemStatement ||
            s.extracted_context?.problem ||
            s.lastMessage ||
            '';
          const industry =
            s.extracted_context?.industry || 'Technology';

          return {
            id: s.id,
            name: title,
            title: title,
            description: problem || 'Interactive chat validation concept.',
            problemStatement: problem,
            proposedSolution:
              s.extracted_context?.proposedSolution ||
              s.extracted_context?.solution ||
              '',
            targetCustomer: s.extracted_context?.targetCustomer || '',
            industry: industry,
            location: 'Global',
            businessModel:
              s.extracted_context?.revenueModel ||
              s.extracted_context?.businessModel ||
              '',
            revenueModel: s.extracted_context?.revenueModel || '',
            currentStage:
              s.status === 'completed' ? 'Validated' : 'Chat Session',
            overall_score: scoreNum,
            score: scoreNum,
            scoreDisplay: scorePercent !== null ? `${scorePercent}%` : null,
            classification: classification,
            createdAt: s.created_at || s.createdAt || new Date().toISOString(),
            created_at: s.created_at || s.createdAt || new Date().toISOString(),
            updatedAt:
              s.updated_at || s.updatedAt || s.created_at || s.createdAt,
            version: s.version || s.reportsCount || 1,
            reportsCount:
              s.reportsCount || (valRes || scoreNum !== null ? 1 : 0),
            isValidated: !!(valRes || scoreNum !== null),
            is_validated: !!(valRes || scoreNum !== null),
            conversationId: s.id,
            sessionId: s.id,
            source: 'session' as const,
            latestReport:
              valRes || scoreNum !== null
                ? {
                    id: valRes?.report_id || valRes?.id || s.id,
                    versionNumber: s.version || s.reportsCount || 1,
                    overallScore: scoreNum ?? 0,
                    validationPercentage: scorePercent ?? 0,
                    validationCategory: classification || 'Needs Improvement',
                    summary: valRes?.summary || '',
                    createdAt:
                      s.created_at || s.createdAt || new Date().toISOString(),
                  }
                : null,
          };
        });

      let allItems = [...mappedIdeas, ...mappedSessions];

      // Client-side search
      if (search.trim()) {
        const q = search.toLowerCase();
        allItems = allItems.filter(
          (i: any) =>
            (i.name && i.name.toLowerCase().includes(q)) ||
            (i.title && i.title.toLowerCase().includes(q)) ||
            (i.description && i.description.toLowerCase().includes(q)) ||
            (i.problemStatement && i.problemStatement.toLowerCase().includes(q)) ||
            (i.industry && i.industry.toLowerCase().includes(q))
        );
      }

      // Category filter
      if (category && category !== 'All') {
        allItems = allItems.filter((i: any) => {
          const repCategory =
            i.classification || i.latestReport?.validationCategory;
          return (
            repCategory === category ||
            (i.industry &&
              i.industry.toLowerCase().includes(category.toLowerCase()))
          );
        });
      }

      // Sort
      if (sort === 'highest-score') {
        allItems.sort((a: any, b: any) => {
          const sa =
            a.latestReport?.validationPercentage ??
            (a.scoreDisplay
              ? parseInt(a.scoreDisplay)
              : a.overall_score
              ? a.overall_score * 10
              : 0);
          const sb =
            b.latestReport?.validationPercentage ??
            (b.scoreDisplay
              ? parseInt(b.scoreDisplay)
              : b.overall_score
              ? b.overall_score * 10
              : 0);
          return sb - sa;
        });
      } else if (sort === 'lowest-score') {
        allItems.sort((a: any, b: any) => {
          const sa =
            a.latestReport?.validationPercentage ??
            (a.scoreDisplay
              ? parseInt(a.scoreDisplay)
              : a.overall_score
              ? a.overall_score * 10
              : 0);
          const sb =
            b.latestReport?.validationPercentage ??
            (b.scoreDisplay
              ? parseInt(b.scoreDisplay)
              : b.overall_score
              ? b.overall_score * 10
              : 0);
          return sa - sb;
        });
      } else if (sort === 'oldest') {
        allItems.sort(
          (a: any, b: any) =>
            new Date(a.createdAt || a.created_at).getTime() -
            new Date(b.createdAt || b.created_at).getTime()
        );
      } else {
        // newest
        allItems.sort(
          (a: any, b: any) =>
            new Date(b.createdAt || b.created_at).getTime() -
            new Date(a.createdAt || a.created_at).getTime()
        );
      }

      setIdeas(allItems);
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
      if (selectedIdeaForDelete.source === 'session') {
        await api.deleteConversation(String(selectedIdeaForDelete.id));
      } else {
        await api.deleteIdea(String(selectedIdeaForDelete.id));
        if (selectedIdeaForDelete.conversationId) {
          try {
            await api.deleteConversation(String(selectedIdeaForDelete.conversationId));
          } catch {
            // ignore if conversation already deleted
          }
        }
      }
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

  const handleOpenVersionHistory = async (idea: IdeaCardItem) => {
    setSelectedIdeaForHistory(idea);
    setHistoryModalOpen(true);
    setVersionsLoading(true);

    try {
      if (idea.source === 'session' && idea.latestReport) {
        setVersionReports([
          {
            id: idea.latestReport.id,
            versionNumber: idea.latestReport.versionNumber || 1,
            overallScore: idea.latestReport.overallScore,
            validationPercentage: idea.latestReport.validationPercentage,
            validationCategory: idea.latestReport.validationCategory,
            summary: idea.latestReport.summary || '',
            recommendedAction: 'Continue chatting to iterate on your score.',
            createdAt: idea.latestReport.createdAt || new Date().toISOString(),
            scores: {
              marketDemand: 7,
              problemSeverity: 7,
              competition: 6,
              targetCustomer: 7,
              innovation: 7,
              feasibility: 8,
              revenuePotential: 7,
            },
          },
        ]);
      } else {
        const res = await api.getIdeaReports(String(idea.id));
        setVersionReports(res.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch idea reports:', err);
      if (idea.latestReport) {
        setVersionReports([
          {
            id: idea.latestReport.id,
            versionNumber: idea.latestReport.versionNumber || 1,
            overallScore: idea.latestReport.overallScore,
            validationPercentage: idea.latestReport.validationPercentage,
            validationCategory: idea.latestReport.validationCategory,
            summary: idea.latestReport.summary || '',
            recommendedAction: 'Continue chatting to iterate on your score.',
            createdAt: idea.latestReport.createdAt || new Date().toISOString(),
            scores: {
              marketDemand: 7,
              problemSeverity: 7,
              competition: 6,
              targetCustomer: 7,
              innovation: 7,
              feasibility: 8,
              revenuePotential: 7,
            },
          },
        ]);
      } else {
        setVersionReports([]);
      }
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
              title="Grid View"
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
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* STEP 5: Loading Skeleton (3 pulse cards) while fetching */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 dark:bg-dark-border rounded w-24"></div>
                <div className="h-5 bg-slate-200 dark:bg-dark-border rounded-full w-20"></div>
              </div>
              <div className="h-6 bg-slate-200 dark:bg-dark-border rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-dark-border rounded w-full"></div>
                <div className="h-3 bg-slate-200 dark:bg-dark-border rounded w-5/6"></div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex justify-between items-end">
                <div className="space-y-1">
                  <div className="h-3 bg-slate-200 dark:bg-dark-border rounded w-10"></div>
                  <div className="h-7 bg-slate-200 dark:bg-dark-border rounded w-16"></div>
                </div>
                <div className="h-4 bg-slate-200 dark:bg-dark-border rounded w-20"></div>
              </div>
              <div className="pt-2 flex gap-2">
                <div className="h-9 bg-slate-200 dark:bg-dark-border rounded-xl flex-1"></div>
                <div className="h-9 bg-slate-200 dark:bg-dark-border rounded-xl w-24"></div>
              </div>
            </div>
          ))}
        </div>
      ) : ideas.length === 0 ? (
        /* Only show EmptyState if merged array is truly empty after both calls resolve */
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
        /* STEP 4: Grid View with IdeaCard component handling both sources */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onOpenHistory={handleOpenVersionHistory}
              onDelete={(i) => {
                setSelectedIdeaForDelete(i);
                setDeleteModalOpen(true);
              }}
            />
          ))}
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
                const rawScore =
                  idea.overall_score ?? idea.score ?? report?.overallScore;
                const scorePercent =
                  report?.validationPercentage ??
                  (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore))
                    ? Number(rawScore) <= 10 && Number(rawScore) > 0
                      ? Math.round(Number(rawScore) * 10)
                      : Math.round(Number(rawScore))
                    : null);

                const classification =
                  idea.classification ||
                  report?.validationCategory ||
                  (scorePercent !== null
                    ? scorePercent >= 80
                      ? 'Highly Promising'
                      : scorePercent >= 60
                      ? 'Promising'
                      : scorePercent >= 40
                      ? 'Needs Improvement'
                      : 'High Risk'
                    : null);

                const isSession = idea.source === 'session';
                const reportHref = isSession
                  ? `/validate-idea?session=${idea.id}`
                  : report?.id
                  ? `/report/${report.id}`
                  : `/ideas/${idea.id}/report`;

                const chatHref = isSession
                  ? `/validate-idea?session=${idea.id}`
                  : idea.conversationId
                  ? `/validate?conversationId=${idea.conversationId}`
                  : '/validate';

                const title =
                  idea.title ||
                  idea.name ||
                  idea.extracted_context?.startupName ||
                  'Untitled Idea';
                const problemDesc =
                  idea.problemStatement ||
                  idea.description ||
                  idea.extracted_context?.problemStatement ||
                  '';

                return (
                  <tr
                    key={idea.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-dark-hover/60 transition"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-dark-text text-sm">
                          {title}
                        </p>
                        {isSession && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                            Chat
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-dark-muted truncate max-w-xs mt-0.5">
                        {problemDesc}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-dark-muted">
                      {idea.industry || 'Technology'}
                    </td>
                    <td className="py-4 px-6">
                      {scorePercent !== null ? (
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                          {formatOverallScore(scorePercent, rawScore)}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {classification ? (
                        <StatusBadge category={classification as any} size="sm" />
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                          Unanalyzed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {idea.reportsCount && idea.reportsCount > 0 ? (
                        <button
                          onClick={() => handleOpenVersionHistory(idea)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <History className="w-3 h-3" />
                          <span>
                            v{report?.versionNumber || idea.version || idea.reportsCount} ({idea.reportsCount})
                          </span>
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={chatHref}
                          className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition"
                          title="Continue Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>

                        {(scorePercent !== null || report || isSession) && (
                          <Link
                            to={reportHref}
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
        title={`Validation History — ${selectedIdeaForHistory?.title || selectedIdeaForHistory?.name || 'Startup'}`}
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
                      {formatOverallScore(v.validationPercentage, v.overallScore)}
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
              {selectedIdeaForDelete?.title || selectedIdeaForDelete?.name}
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
