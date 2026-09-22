import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { ideasApi } from '../api/ideas';
import { validationApi } from '../api/validation';
import type { IdeaResponse } from '../types/idea';
import type { ValidationResponse } from '../types/validation';
import {
  FolderKanban,
  Sparkles,
  Trash2,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface IdeaCardItem {
  idea: IdeaResponse;
  validation: ValidationResponse | null;
}

export const Ideas: React.FC = () => {
  const [items, setItems] = useState<IdeaCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchIdeas = async () => {
    try {
      const userIdeas = await ideasApi.getIdeas();
      const list: IdeaCardItem[] = await Promise.all(
        userIdeas.map(async (idea) => {
          try {
            const val = await validationApi.getLatestValidation(idea.id);
            return { idea, validation: val };
          } catch (err) {
            return { idea, validation: null };
          }
        })
      );
      setItems(list);
    } catch (err) {
      console.error('Failed to load user ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleDelete = async (ideaId: number) => {
    if (!confirm('Are you sure you want to delete this startup idea?')) return;
    try {
      await ideasApi.deleteIdea(ideaId);
      setItems((prev) => prev.filter((i) => i.idea.id !== ideaId));
    } catch (err) {
      console.error('Delete idea failed:', err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full relative overflow-y-auto bg-slate-950 p-6 sm:p-8">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <FolderKanban className="w-6 h-6 text-cyan-400" />
                <span>My Startup Ideas</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">Manage and review your saved validation submissions</p>
            </div>

            <button
              onClick={() => navigate('/app')}
              className="py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create New Idea</span>
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-3" />
              <p className="text-xs font-medium">Fetching saved startup ideas...</p>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto my-12">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Startup Ideas Submitted Yet</h3>
              <p className="text-xs text-slate-400 mt-2 mb-6">
                Start by describing your startup concept in the AI workspace to generate validation reports.
              </p>
              <button
                onClick={() => navigate('/app')}
                className="py-2.5 px-5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open AI Workspace</span>
              </button>
            </div>
          ) : (
            /* Idea Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map(({ idea, validation }) => (
                <div
                  key={idea.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800/60">
                        VERSION {idea.version}
                      </span>

                      {validation && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          validation.classification === 'EXCEPTIONAL' || validation.classification === 'STRONG'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {validation.classification}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{idea.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                      {idea.description}
                    </p>
                  </div>

                  <div>
                    {/* Score Bar preview if validation exists */}
                    {validation && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Latest Score</p>
                          <p className="text-xl font-black text-white">{validation.overall_score} <span className="text-xs font-normal text-slate-400">/ 100</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Confidence</p>
                          <p className="text-sm font-bold text-emerald-400">{validation.confidence_score}%</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>

                      <button
                        onClick={() => navigate('/app')}
                        className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <span>Open Workspace</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
