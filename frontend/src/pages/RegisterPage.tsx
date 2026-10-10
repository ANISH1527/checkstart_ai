import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  User,
  Mail,
  Lock,
  School,
  BookOpen,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  GoogleAccountChooserModal,
  GoogleAccountProfile,
} from '../components/GoogleAccountChooserModal';

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '659981468656-7rb8trd9vbuijaqncul1lmb46f0iulb6.apps.googleusercontent.com';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Academic details (optional)
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [graduationYear, setGraduationYear] = useState<number | ''>(2026);
  const [showAcademicDetails, setShowAcademicDetails] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [googleChooserOpen, setGoogleChooserOpen] = useState(false);

  // Password validation checks
  const passwordHasUpper = /[A-Z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordHasMinLen = password.length >= 8;

  // Handle local registration submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }

    if (!passwordHasMinLen || !passwordHasUpper || !passwordHasNumber) {
      setError('Password must be at least 8 characters with at least one uppercase letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        college: college.trim() || undefined,
        course: course.trim() || undefined,
        graduationYear: graduationYear ? Number(graduationYear) : undefined,
      });

      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google registration failed. Please try again.');
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
        } catch (e) {
          console.error('Failed to initialize GIS on register:', e);
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

  // Fallback handler for account chooser
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
      <div className="w-full max-w-lg mx-auto flex justify-end">
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

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
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

        {/* Central Registration Card */}
        <div className="bg-white dark:bg-dark-card py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-dark-border rounded-3xl space-y-5 transition-colors">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-dark-text tracking-tight">
              Create your account
            </h2>
            <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
              Get started with free AI validation for your student venture.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@college.edu"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password & Confirm Password in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="Min 8 characters"
                    className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirement Indicators */}
            {password.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-input/60 border border-slate-200/80 dark:border-dark-border flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                <span className={`flex items-center gap-1 ${passwordHasMinLen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3 h-3" /> 8+ chars
                </span>
                <span className={`flex items-center gap-1 ${passwordHasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3 h-3" /> Uppercase
                </span>
                <span className={`flex items-center gap-1 ${passwordHasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3 h-3" /> Number
                </span>
              </div>
            )}

            {/* Optional Academic Details Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAcademicDetails(!showAcademicDetails)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showAcademicDetails ? '- Hide university details' : '+ Add college / university (optional)'}</span>
              </button>

              {showAcademicDetails && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-dark-input/40 border border-slate-200 dark:border-dark-border space-y-3.5 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      College / University
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <School className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="e.g. Stanford University, MIT"
                        className="block w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Course / Major
                      </label>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="block w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Graduation Year
                      </label>
                      <div className="relative rounded-xl shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <select
                          value={graduationYear}
                          onChange={(e) => setGraduationYear(e.target.value ? Number(e.target.value) : '')}
                          className="block w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-xs focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value={2024}>2024</option>
                          <option value={2025}>2025</option>
                          <option value={2026}>2026</option>
                          <option value={2027}>2027</option>
                          <option value={2028}>2028</option>
                          <option value={2029}>2029</option>
                          <option value={2030}>2030</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer pt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* ──────── OR ──────── Separator */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-dark-border" />
            <span className="flex-shrink mx-4 text-xs uppercase tracking-widest text-slate-400 dark:text-dark-muted font-bold">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-dark-border" />
          </div>

          {/* Google OAuth Button */}
          <div className="space-y-3">
            {googleLoading ? (
              <div className="py-3 flex items-center justify-center gap-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing up with Google...</span>
              </div>
            ) : (
              <>
                <div className="flex justify-center min-h-[44px] items-center">
                  <div ref={googleButtonRef} className="flex justify-center w-full" />
                </div>

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

          {/* Already have an account link */}
          <div className="text-center pt-2 text-xs text-slate-500 dark:text-dark-muted">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>

      <div />

      {/* Fallback Google Account Chooser Modal */}
      <GoogleAccountChooserModal
        isOpen={googleChooserOpen}
        onClose={() => setGoogleChooserOpen(false)}
        onSelectAccount={handleMockAccountSelected}
      />
    </div>
  );
};

