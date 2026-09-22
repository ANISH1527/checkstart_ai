import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  PlusCircle,
  FolderKanban,
  History,
  LogOut,
  User
} from 'lucide-react';

interface SidebarProps {
  onNewValidation?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewValidation }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Logo */}
        <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-base leading-none">StartupAI</h1>
            <p className="text-[11px] text-cyan-400 font-medium mt-1">Idea Validation Platform</p>
          </div>
        </div>

        {/* New Validation Button */}
        <div className="p-3">
          <button
            onClick={() => {
              if (onNewValidation) onNewValidation();
              navigate('/app');
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all duration-200"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Validation</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <NavLink
            to="/app"
            end
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Workspace</span>
          </NavLink>

          <NavLink
            to="/app/ideas"
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <FolderKanban className="w-4 h-4" />
            <span>My Startup Ideas</span>
          </NavLink>

          <NavLink
            to="/app/history"
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <History className="w-4 h-4" />
            <span>Validation History</span>
          </NavLink>
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-cyan-400 font-bold text-xs border border-slate-600">
              {user?.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Founder'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
