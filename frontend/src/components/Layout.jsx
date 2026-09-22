import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { 
  LayoutDashboard, 
  Lightbulb, 
  PlusCircle, 
  LogOut, 
  Rocket, 
  User as UserIcon,
  ChevronRight
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Ideas', path: '/dashboard', icon: Lightbulb },
    { label: 'New Idea', path: '/ideas/new', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-lg tracking-tight block">IdeaValidator</span>
            <span className="text-xs text-indigo-600 font-semibold tracking-wider uppercase">AI Platform</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/60 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-4 h-4 text-indigo-500" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout at Bottom */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3 mb-3 p-2 rounded-xl bg-white border border-gray-200/80 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {getInitials(user?.name || user?.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name || 'Founder'}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-sm font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight text-base">IdeaValidator AI</span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-900">IdeaValidator AI</span>
            <span>/</span>
            <span className="text-gray-600 capitalize">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-full border border-gray-200/60">
              <UserIcon className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-xs text-gray-800">{user?.email}</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {getInitials(user?.name || user?.email)}
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Prompt 7) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 flex items-center justify-around px-2 shadow-lg">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center w-14 h-full ${
            isActive('/dashboard') ? 'text-indigo-600 font-bold' : 'text-gray-500 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Dashboard</span>
        </Link>

        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center w-14 h-full ${
            isActive('/ideas') ? 'text-indigo-600 font-bold' : 'text-gray-500 font-medium'
          }`}
        >
          <Lightbulb className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Ideas</span>
        </Link>

        <Link
          to="/ideas/new"
          className="flex flex-col items-center justify-center -mt-5"
          aria-label="Create New Idea"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300 active:scale-95 transition">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] text-indigo-700 font-bold mt-1">New</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-14 h-full text-gray-500 font-medium hover:text-red-600"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
