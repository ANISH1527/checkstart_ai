import React from 'react';
import { ValidationConversation } from '../types';
import { Plus, MessageSquare, Trash2, Clock, X } from 'lucide-react';

interface ChatHistorySidebarProps {
  conversations: ValidationConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewIdea: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  loading?: boolean;
  onCloseMobile?: () => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  onNewIdea,
  onDelete,
  loading = false,
  onCloseMobile,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-50/90 dark:bg-dark-card border-r border-slate-200/90 dark:border-dark-border text-slate-800 dark:text-dark-text transition-colors select-none">
      {/* Top Action: New Startup Idea & Mobile Close Button */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-dark-border bg-white dark:bg-dark-card flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onNewIdea}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-indigo-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Startup Idea</span>
        </button>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-dark-input text-slate-500 dark:text-dark-muted hover:text-slate-900 dark:hover:text-dark-text cursor-pointer flex-shrink-0"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1.5 scrollbar-thin">
        <div className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-dark-muted flex items-center justify-between">
          <span>Previous Conversations</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-dark-muted">
            {loading ? '-' : conversations.length}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2 py-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse p-2.5 rounded-xl bg-white/50 dark:bg-dark-input/40 border border-slate-200/40 dark:border-dark-border/40 flex items-center gap-2.5"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-sm w-3/4" />
                  <div className="h-2.5 bg-slate-200/70 dark:bg-slate-700/60 rounded-sm w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-slate-400 dark:text-dark-muted text-xs">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-dark-input flex items-center justify-center mx-auto mb-2 text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-4 h-4" />
            </div>
            <p className="font-bold text-slate-600 dark:text-slate-300">No conversations yet</p>
            <p className="text-[11px] mt-1 text-slate-400 dark:text-dark-muted leading-relaxed">
              Click &quot;New Startup Idea&quot; to start chatting with your validation mentor.
            </p>
          </div>
        ) : (

          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/90 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-200 shadow-xs'
                    : 'bg-white/70 dark:bg-dark-input/60 hover:bg-white dark:hover:bg-dark-input hover:border-slate-200 dark:hover:border-slate-600 border border-slate-200/60 dark:border-dark-border text-slate-700 dark:text-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-6">
                  <div
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate leading-tight ${isActive ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-800 dark:text-dark-text'}`}>
                      {conv.title || 'New Startup Idea'}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-[11px] text-slate-500 dark:text-dark-muted truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                      <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                {/* Delete button on hover */}
                <button
                  type="button"
                  onClick={(e) => onDelete(conv.id, e)}
                  title="Delete conversation"
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition absolute right-2 top-2.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

