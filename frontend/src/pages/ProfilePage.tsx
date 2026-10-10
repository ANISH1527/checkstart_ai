import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Toast } from '../components/Toast';
import { UserAvatar } from '../components/UserAvatar';
import {
  User,
  Mail,
  School,
  BookOpen,
  Calendar,
  Save,
  Loader2,
  Shield,
  Sparkles,
  Clock,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [course, setCourse] = useState(user?.course || '');
  const [graduationYear, setGraduationYear] = useState<number | ''>(
    user?.graduationYear || 2026
  );

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCollege(user.college || '');
      setCourse(user.course || '');
      setGraduationYear(user.graduationYear || 2026);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.updateProfile({
        name,
        college: college.trim() || null,
        course: course.trim() || null,
        graduationYear: graduationYear ? Number(graduationYear) : null,
      });

      updateUser(res.user);
      setToastMessage('Profile information updated successfully!');
      setToastType('success');
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to update profile.');
      setToastType('error');
    } finally {
      setLoading(false);
    }
  };

  const isGoogleUser = user?.authProvider === 'GOOGLE';

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-dark-text tracking-tight">
          Student Founder Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-muted mt-1">
          Manage your academic background, university affiliation, and account security.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-dark-border">
          <div className="flex items-center gap-4">
            <UserAvatar
              src={user?.profileImage}
              name={user?.name}
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-dark-text">
                  {user?.name}
                </h2>
                {isGoogleUser ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <CheckCircle2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Google</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-dark-input text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-border">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>Email &amp; Password</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-dark-muted font-mono mt-0.5">
                {user?.email}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                Authentication: <strong className="font-bold">{isGoogleUser ? 'Google' : 'Email & Password'}</strong>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 dark:text-dark-muted space-y-1">
            <p className="flex items-center sm:justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Last active:{' '}
                {user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : 'Active now'}
              </span>
            </p>
            <p className="flex items-center sm:justify-end gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Member since:{' '}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : 'August 2026'}
              </span>
            </p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Email (Disabled if Google Auth) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Email Address</span>
                {isGoogleUser && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 lowercase flex items-center gap-1 font-normal">
                    <Lock className="w-3 h-3" /> managed by Google
                  </span>
                )}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-100 dark:bg-dark-input/50 text-slate-500 dark:text-slate-400 text-xs sm:text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* College / University */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                College / University
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <School className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Stanford University, MIT, UC Berkeley"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Major / Department */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Major / Academic Course
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <BookOpen className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. Computer Science, Mechanical Engineering"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Expected Graduation Year */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Expected Graduation Year
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <select
                  value={graduationYear}
                  onChange={(e) =>
                    setGraduationYear(e.target.value ? Number(e.target.value) : '')
                  }
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
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

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-dark-border">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
