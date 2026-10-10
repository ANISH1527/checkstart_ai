import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Mail,
  Lock,
} from 'lucide-react';
import {
  GoogleAccountChooserModal,
  GoogleAccountProfile,
} from '../components/GoogleAccountChooserModal';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '659981468656-7rb8trd9vbuijaqncul1lmb46f0iulb6.apps.googleusercontent.com';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Form states
  const [identifier, setIdentifier] = useState(() => {
    return localStorage.getItem('ai_validate_remembered_identifier') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('ai_validate_remembered_identifier');
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [googleChooserOpen, setGoogleChooserOpen] = useState(false);

  // Handle standard Email/Username + Password Login
  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your email or username and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.login({
        identifier: identifier.trim(),
        password,
      });

      if (rememberMe) {
        localStorage.setItem('ai_validate_remembered_identifier', identifier.trim());
      } else {
        localStorage.removeItem('ai_validate_remembered_identifier');
      }

      login(res.token, res.user);
      if (res.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google GIS credential response
  const handleCredentialResponse = async (response: any) => {
    if (!response?.credential) {
      setError('Failed to receive Google credential. Please try again.');
      return;
    }

    setError(null);
    setGoogleLoading(true);

    try {
      const res = await api.googleAuth({ credential: response.credential });
      login(res.token, res.user);
      if (res.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    let timer: any;

    const setupGIS = () => {
      if (window.google?.accounts?.id && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          googleButtonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: theme === 'dark' ? 'filled_black' : 'outline',
            size: 'large',
            type: 'standard',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 340,
          });

          setGisLoaded(true);

          try {
            window.google.accounts.id.prompt();
          } catch {
            // One-tap prompt might be silently suppressed by Google policy
          }
        } catch (e) {
          console.error('Failed to initialize Google Identity Services:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      setupGIS();
    } else {
      timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          setupGIS();
        }
      }, 150);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [theme]);

  // Fallback handler for account chooser in testing / adblocked environments
  const handleMockAccountSelected = async (account: GoogleAccountProfile) => {
    setError(null);
    setGoogleLoading(true);
    setGoogleChooserOpen(false);

    try {
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(account.email)}`;
      const res = await api.googleAuth({
        email: account.email,
        name: account.name,
        googleId: `google_${Date.now()}`,
        profileImage: avatarUrl,
        college: account.college || 'bitsathy.ac.in',
        course: account.course || 'Computer Science & Engineering',
      });

      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-dark-bg text-slate-900 dark:text-dark-text flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      {/* Top Bar with Theme Toggle */}
      <div className="w-full max-w-md mx-auto flex justify-end">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-600 dark:text-dark-muted hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs transition-all hover:scale-105 cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-dark-text">
              ✨ AI <span className="text-indigo-600">Validate</span>
            </span>
          </Link>
          <p className="text-sm text-slate-600 dark:text-dark-muted font-medium">
            Turn your startup idea into a real plan.
          </p>
        </div>

        {/* Central Authentication Card */}
        <div className="bg-white dark:bg-dark-card py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-dark-border rounded-3xl space-y-5 transition-colors">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Username + Password Login Form */}
          <form onSubmit={handleLocalLogin} className="space-y-4">
            {/* Email or Username */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email or Username
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or username"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-dark-muted font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-dark-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Log in</span>
              )}
            </button>
          </form>

          {/* ─── OR ─── Separator */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-dark-border" />
            <span className="flex-shrink mx-4 text-xs uppercase tracking-widest text-slate-400 dark:text-dark-muted font-bold">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-dark-border" />
          </div>

          {/* Continue with Google */}
          <div className="space-y-3">
            {googleLoading ? (
              <div className="py-3 flex items-center justify-center gap-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying with Google...</span>
              </div>
            ) : (
              <>
                <div className="flex justify-center min-h-[44px] items-center">
                  <div ref={googleButtonRef} className="flex justify-center w-full" />
                </div>

                {/* Fallback button if GIS script is delayed or blocked */}
                {!gisLoaded && (
                  <button
                    type="button"
                    onClick={() => setGoogleChooserOpen(true)}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-full border border-slate-300 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-input text-xs sm:text-sm font-bold text-slate-800 dark:text-dark-text shadow-xs transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Registration Option */}
          <div className="text-center pt-2 text-xs text-slate-500 dark:text-dark-muted">
            <span>Don&apos;t have an account? </span>
            <Link
              to="/register"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Register now
            </Link>
          </div>
        </div>

        {/* Footer info & Discrete Admin Link */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500 inline" />
            <span>Secure • Simple • Free</span>
          </div>

          <div>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <span>Admin Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div />

      {/* Google Account Chooser Modal (used if GIS is blocked by browser adblocker) */}
      <GoogleAccountChooserModal
        isOpen={googleChooserOpen}
        onClose={() => setGoogleChooserOpen(false)}
        onSelectAccount={handleMockAccountSelected}
      />
    </div>
  );
};
