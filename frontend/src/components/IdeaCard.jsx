import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Trash2, RotateCw, Edit3, ArrowRight, ShieldCheck } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

const IdeaCard = ({ idea, onDeleteSuccess }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getClassificationBadge = (cls, isValidated) => {
    if (!isValidated) return 'bg-gray-100 text-gray-600 border-gray-200';
    const c = (cls || 'MODERATE').toUpperCase();
    switch (c) {
      case 'EXCEPTIONAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'STRONG':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'MODERATE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'WEAK':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'VERY_WEAK':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const score = idea.latest_score || idea.overall_score || 0;
  const isValidated = idea.is_validated || idea.latest_score !== undefined || idea.latest_score !== null;

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await apiClient.delete(`/ideas/${idea.id}`);
      toast.success('Idea deleted');
      setShowDeleteModal(false);
      if (onDeleteSuccess) onDeleteSuccess(idea.id);
    } catch (err) {
      toast.error('Failed to delete idea');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      onClick={() => navigate(`/ideas/${idea.id}`)}
      className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer relative flex flex-col justify-between group"
    >
      <div>
        {/* Top Badge & 3-Dot Menu */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-[11px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getClassificationBadge(
              idea.latest_classification || idea.classification,
              isValidated && score > 0
            )}`}
          >
            {isValidated && score > 0
              ? idea.latest_classification || idea.classification || 'VALIDATED'
              : 'Not Validated'}
          </span>

          {/* 3-Dot Quick Action Menu (Prompt 7) */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 opacity-80 group-hover:opacity-100 transition"
              aria-label="Quick actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 text-xs font-medium"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate(`/ideas/${idea.id}`);
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate(`/ideas/${idea.id}/validate`);
                  }}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Re-validate</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-gray-100"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-indigo-600 transition-colors">
          {idea.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
          {idea.description}
        </p>

        {/* Score Bar if validated */}
        {isValidated && score > 0 ? (
          <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span className="text-gray-600">Validation Score</span>
              <span className="text-indigo-700 font-bold">{Math.round(score)}/100</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-amber-50/60 p-3 rounded-xl border border-amber-100/80 text-xs text-amber-800 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Ready for 15-layer AI validation</span>
          </div>
        )}
      </div>

      {/* Card Footer Row */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500 mt-2">
        <div className="flex items-center space-x-2">
          <span className="bg-gray-100 font-semibold px-2 py-0.5 rounded-md text-gray-700 text-[11px]">
            V{idea.version || 1}
          </span>
          <span className="text-[11px] text-gray-400">{formatDate(idea.created_at)}</span>
        </div>

        {isValidated && score > 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/ideas/${idea.id}`);
            }}
            className="px-3.5 py-1.5 rounded-xl border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold text-xs transition"
          >
            View Report
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/ideas/${idea.id}/validate`);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs flex items-center space-x-1"
          >
            <span>Validate Now</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal (Prompt 7) */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Delete this idea?</h4>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              This will remove "{idea.title}" and its validation history. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaCard;
