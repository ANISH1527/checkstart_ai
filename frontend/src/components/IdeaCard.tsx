import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { ValidationCategory } from '../types';
import { formatOverallScore } from '../utils/scoreUtils';
import {
  Calendar,
  Sparkles,
  MessageSquare,
  History,
  Trash2,
  Layers,
} from 'lucide-react';

export interface IdeaCardItem {
  id: string | number;
  name?: string;
  title?: string;
  description?: string;
  problemStatement?: string;
  industry?: string;
  extracted_context?: {
    startupName?: string;
    problem?: string;
    problemStatement?: string;
    proposedSolution?: string;
    targetCustomer?: string;
    industry?: string;
    [key: string]: any;
  };
  overall_score?: number | null;
  score?: number | null;
  scoreDisplay?: string | null;
  classification?: ValidationCategory | string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  version?: number;
  reportsCount?: number;
  isValidated?: boolean;
  is_validated?: boolean;
  conversationId?: string | null;
  sessionId?: string | null;
  source?: 'idea' | 'session';
  currentStage?: string;
  latestReport?: {
    id: string;
    versionNumber?: number;
    overallScore: number;
    validationPercentage: number;
    validationCategory: ValidationCategory;
    summary?: string;
    createdAt?: string;
  } | null;
  [key: string]: any;
}

interface IdeaCardProps {
  idea: IdeaCardItem;
  onOpenHistory?: (idea: IdeaCardItem) => void;
  onDelete?: (idea: IdeaCardItem) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  onOpenHistory,
  onDelete,
}) => {
  // 1. Title Resolution (from title, name, or extracted_context)
  const title =
    idea.title && idea.title !== 'New Startup Idea' && idea.title !== 'Untitled Idea'
      ? idea.title
      : idea.name && idea.name !== 'New Startup Idea' && idea.name !== 'Untitled Idea'
      ? idea.name
      : idea.extracted_context?.startupName ||
        idea.extracted_context?.problem?.slice(0, 60) ||
        idea.extracted_context?.problemStatement?.slice(0, 60) ||
        idea.title ||
        idea.name ||
        'Untitled Idea';

  // 2. Score Resolution (0-10 scaled to 0-100%, or 0-100 directly)
  const rawScore =
    idea.overall_score ??
    idea.score ??
    idea.latestReport?.overallScore ??
    idea.latestReport?.validationPercentage;

  let scorePercentage: number | null = null;
  if (rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore))) {
    const num = Number(rawScore);
    scorePercentage = num <= 10 && num > 0 ? Math.round(num * 10) : Math.round(num);
  }

  // 3. Classification Badge
  const classification = (idea.classification ||
    idea.latestReport?.validationCategory ||
    (scorePercentage !== null
      ? scorePercentage >= 80
        ? 'Highly Promising'
        : scorePercentage >= 60
        ? 'Promising'
        : scorePercentage >= 40
        ? 'Needs Improvement'
        : 'High Risk'
      : null)) as ValidationCategory | null;

  // 4. Date formatting
  const dateStr =
    idea.updatedAt ||
    idea.updated_at ||
    idea.createdAt ||
    idea.created_at ||
    new Date().toISOString();
  const formattedDate = new Date(dateStr).toLocaleDateString();

  // 5. Versioning
  const report = idea.latestReport;
  const reportsCount = idea.reportsCount || (idea.version && idea.version > 1 ? idea.version : (report || scorePercentage !== null ? 1 : 0));
  const versionNum = report?.versionNumber || idea.version || (reportsCount > 0 ? reportsCount : 1);

  // 6. Navigation Link Resolution based on source
  const isSessionSource = idea.source === 'session';
  const reportHref = isSessionSource
    ? `/validate-idea?session=${idea.id}`
    : report?.id
    ? `/report/${report.id}`
    : `/ideas/${idea.id}/report`;

  const chatHref = isSessionSource
    ? `/validate-idea?session=${idea.id}`
    : idea.conversationId
    ? `/validate?conversationId=${idea.conversationId}`
    : '/validate';

  const industry = idea.industry || idea.extracted_context?.industry || 'Technology';
  const description =
    idea.description ||
    idea.problemStatement ||
    idea.extracted_context?.problemStatement ||
    idea.extracted_context?.problem ||
    'Interactive startup validation concept.';

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {industry}
            </span>
            {isSessionSource && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                Chat Session
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {reportsCount > 1 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                v{versionNum}
              </span>
            )}
            {classification && <StatusBadge category={classification} size="sm" />}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text line-clamp-1" title={title}>
          {title}
        </h3>

        <p className="text-xs text-slate-500 dark:text-dark-muted line-clamp-2 mt-1.5 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Score & Meta */}
      <div className="pt-4 border-t border-slate-100 dark:border-dark-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Score</p>
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {scorePercentage !== null ? formatOverallScore(scorePercentage, rawScore) : 'Pending'}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-end">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-dark-muted font-medium">
              {reportsCount > 0
                ? `${reportsCount} ${reportsCount === 1 ? 'version' : 'versions'}`
                : idea.currentStage || 'Draft'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            {/* 1. Continue Conversation */}
            <Link
              to={chatHref}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Continue Chat</span>
            </Link>

            {/* 2. View Report */}
            {(scorePercentage !== null || report || isSessionSource) && (
              <Link
                to={reportHref}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-dark-input hover:bg-slate-200 dark:hover:bg-dark-hover text-slate-700 dark:text-dark-text font-bold text-xs transition"
                title="View Report"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>View Report</span>
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            {/* 3. View Version History */}
            {reportsCount > 0 && onOpenHistory ? (
              <button
                type="button"
                onClick={() => onOpenHistory(idea)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-dark-muted text-xs font-semibold transition"
              >
                <History className="w-3 h-3" />
                <span>Version History ({reportsCount})</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                {scorePercentage !== null ? 'Validated' : 'Not validated yet'}
              </span>
            )}

            {/* 4. Delete */}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(idea)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                title="Delete idea"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
