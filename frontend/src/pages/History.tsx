import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { HistoryChart } from '../components/history/HistoryChart';
import { ideasApi } from '../api/ideas';
import { validationApi } from '../api/validation';
import type { IdeaResponse } from '../types/idea';
import type { ValidationHistoryItem } from '../types/validation';
import { History as HistoryIcon, Loader2, Calendar } from 'lucide-react';

export const History: React.FC = () => {
  const [ideas, setIdeas] = useState<IdeaResponse[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);
  const [historyItems, setHistoryItems] = useState<ValidationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const loadIdeas = async () => {
      try {
        const userIdeas = await ideasApi.getIdeas();
        setIdeas(userIdeas);
        if (userIdeas.length > 0) {
          setSelectedIdeaId(userIdeas[0].id);
        }
      } catch (err) {
        console.error('Failed to load user ideas:', err);
      } finally {
        setLoading(false);
      }
    };
    loadIdeas();
  }, []);

  useEffect(() => {
    if (!selectedIdeaId) return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const historyData = await validationApi.getHistory(selectedIdeaId);
        setHistoryItems(historyData);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [selectedIdeaId]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full relative overflow-y-auto bg-slate-950 p-6 sm:p-8">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="pb-6 border-b border-slate-800">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <HistoryIcon className="w-6 h-6 text-cyan-400" />
              <span>Validation Iteration History</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track score trajectory across multiple validation revisions
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-3" />
              <p className="text-xs font-medium">Loading validation history...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto my-12">
              <HistoryIcon className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-300">No History Available</h3>
              <p className="text-xs text-slate-400 mt-1">Submit an idea in the AI workspace to generate history records.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Idea Selector Dropdown */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <label className="text-xs font-semibold text-slate-300">Select Startup Idea:</label>
                <select
                  value={selectedIdeaId || ''}
                  onChange={(e) => setSelectedIdeaId(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 min-w-[240px]"
                >
                  {ideas.map((idea) => (
                    <option key={idea.id} value={idea.id}>
                      {idea.title} (v{idea.version})
                    </option>
                  ))}
                </select>
              </div>

              {historyLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 text-cyan-500 animate-spin mx-auto mb-2" />
                  <span className="text-xs">Fetching version logs...</span>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-xs text-slate-400">
                  No validations executed for this idea yet.
                </div>
              ) : (
                <>
                  {/* History Chart */}
                  <HistoryChart history={historyItems} />

                  {/* History Timeline */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Version Iteration Log</h3>
                    {historyItems.map((item) => (
                      <div key={item.version} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center font-mono font-bold text-cyan-400 text-xs">
                            v{item.version}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">Score: {item.overall_score}/100</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                {item.classification}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-semibold text-emerald-400">{item.confidence_score}% Confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
