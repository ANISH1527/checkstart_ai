import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserAvatar } from './UserAvatar';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  GitCompare,
  User as UserIcon,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Validate Idea', href: '/validate', icon: PlusCircle },
    { label: 'My Ideas', href: '/ideas', icon: FolderKanban },
    { label: 'Compare', href: '/compare', icon: GitCompare },
    { label: 'Profile', href: '/profile', icon: UserIcon },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card border-r border-slate-200/90 dark:border-dark-border text-slate-800 dark:text-dark-text transition-colors">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-dark-text">
            AI <span className="text-indigo-600 dark:text-indigo-400 font-black">Validate</span>
          </span>
        </Link>

        {/* Theme Toggle in Brand Header */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-dark-muted dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-input transition cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs border border-indigo-100/80 dark:border-indigo-900/60'
                    : 'text-slate-600 dark:text-dark-muted hover:bg-slate-50 dark:hover:bg-dark-input hover:text-slate-900 dark:hover:text-dark-text border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-3.5 border-t border-slate-100 dark:border-dark-border space-y-2">
        <div className="flex items-center gap-3 px-2.5 py-2 rounded-2xl bg-slate-50/80 dark:bg-dark-input/60 border border-slate-200/70 dark:border-dark-border">
          <UserAvatar src={user?.profileImage} name={user?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-dark-text truncate">
              {user?.name || 'Student Founder'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-dark-muted truncate">
              {user?.college || user?.email || 'College Founder'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-dark-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 z-30 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sticky Header with Menu Toggle */}
      <div className="md:hidden sticky top-0 z-40 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border px-4 py-3 flex items-center justify-between transition-colors">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-dark-text text-sm">
            AI <span className="text-indigo-600 dark:text-indigo-400">Validate</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-input"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-input"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
