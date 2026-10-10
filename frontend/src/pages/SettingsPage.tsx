import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import {
  GoogleAccountChooserModal,
  GoogleAccountProfile,
} from '../components/GoogleAccountChooserModal';
import {
  Lock,
  Sun,
  Moon,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AlertTriangle,
  UserCheck,
  Key,
  Eye,
  EyeOff,
  LogOut,
  Mail,
  Check,
} from 'lucide-react';

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '659981468656-7rb8trd9vbuijaqncul1lmb46f0iulb6.apps.googleusercontent.com';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const googleReauthButtonRef = useRef<HTMLDivElement>(null);

  const isGoogleUser = user?.authProvider === 'GOOGLE';

  // Password change state (for LOCAL users only)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Delete account modal & verification state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [googleChooserOpen, setGoogleChooserOpen] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Local user verification password state
  const [verifyPassword, setVerifyPassword] = useState('');
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);

  // Handle password change for LOCAL users
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setToastMessage('Please enter your current password.');
      setToastType('error');
      return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setToastMessage('New password must be at least 8 characters with at least one uppercase letter and one number.');
      setToastType('error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setToastMessage('New password and confirmation do not match.');
      setToastType('error');
      return;
    }

    setPasswordLoading(true);

    try {
      await api.updatePassword({
        currentPassword,
        newPassword,
      });

      setToastMessage('Password updated successfully!');
      setToastType('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to update password.');
      setToastType('error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Google credential response for Danger Zone re-authentication
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) {
      setDeleteError('Failed to receive Google credential. Please try again.');
      return;
    }

    setDeleteError(null);
    setVerifyLoading(true);

    try {
      const res = await api.verifyDeleteIdentity({ credential: response.credential });
      setVerificationToken(res.verificationToken);
      setIsIdentityVerified(true);
    } catch (err: any) {
      setDeleteError(err.message || 'Google re-authentication failed.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Setup GIS button inside Delete Modal whenever modal is open and user is Google user
  useEffect(() => {
    if (deleteModalOpen && isGoogleUser && !isIdentityVerified) {
      const timer = setTimeout(() => {
        if (window.google?.accounts?.id && googleReauthButtonRef.current) {
          try {
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: handleGoogleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true,
            });

            googleReauthButtonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleReauthButtonRef.current, {
              theme: theme === 'dark' ? 'filled_black' : 'outline',
              size: 'large',
              type: 'standard',
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left',
              width: 320,
            });
          } catch (e) {
            console.error('Failed to initialize GIS reauth button:', e);
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [deleteModalOpen, isGoogleUser, isIdentityVerified, theme]);

  // Fallback Google account chooser for test/fallback environments
  const handleFallbackGoogleVerify = async (account: GoogleAccountProfile) => {
    setDeleteError(null);
    setVerifyLoading(true);
    setGoogleChooserOpen(false);

    try {
      const res = await api.verifyDeleteIdentity({ googleEmail: account.email });
      setVerificationToken(res.verificationToken);
      setIsIdentityVerified(true);
    } catch (err: any) {
      setDeleteError(err.message || 'Google identity verification failed.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Verify identity for LOCAL users via Current Password
  const handleVerifyLocalPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPassword) {
      setDeleteError('Please enter your current password.');
      return;
    }

    setDeleteError(null);
    setVerifyLoading(true);

    try {
      const res = await api.verifyDeleteIdentity({ password: verifyPassword });
      setVerificationToken(res.verificationToken);
      setIsIdentityVerified(true);
    } catch (err: any) {
      setDeleteError(err.message || 'Incorrect password. Verification failed.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Final account deletion execution
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      setDeleteError('Please type "DELETE" in capital letters to confirm.');
      return;
    }

    if (!verificationToken) {
      setDeleteError('Please verify your identity first before deleting.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await api.deleteAccount({
        confirmText: 'DELETE',
        verificationToken,
      });
      await logout();
      navigate('/');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  const handleOpenDeleteModal = () => {
    setDeleteConfirmationText('');
    setDeleteError(null);
    setVerificationToken(null);
    setIsIdentityVerified(false);
    setVerifyPassword('');
    setDeleteModalOpen(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
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
          Settings &amp; Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-dark-muted mt-1">
          Manage your account security, theme preferences, and data privacy.
        </p>
      </div>

      {/* 1. Account Authentication Overview */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-4 transition-colors">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-dark-border">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-dark-text">
              Authentication Provider
            </h2>
            <p className="text-xs text-slate-500 dark:text-dark-muted">
              Signed in as <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{user?.email}</span>
            </p>
          </div>
        </div>

        {isGoogleUser ? (
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3 text-xs text-indigo-950 dark:text-indigo-200">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Google Authentication Active</p>
              <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                Your account is authenticated using Google OAuth. Password security, 2-Step Verification, and account recovery are managed directly by Google.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input/50 border border-slate-200 dark:border-dark-border flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
            <Mail className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Email &amp; Password Account</p>
              <p className="text-[11px] text-slate-500 dark:text-dark-muted leading-relaxed">
                Your account uses local password authentication. You can change your password below.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Password Management (LOCAL users only) */}
      {!isGoogleUser ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-5 transition-colors">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-dark-border">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-dark-text">
                Change Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-dark-muted">
                Update your account password with a strong, secure combination.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="block w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password & Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className="block w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="block w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-slate-900 dark:text-dark-text text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* 3. Theme Preferences (Interactive Light / Dark Switcher) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border shadow-sm space-y-5 transition-colors">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-dark-border">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-dark-text">
              Theme Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-dark-muted">
              Choose your interface theme. Preference is saved automatically across browser sessions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs'
                : 'border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-dark-text">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Mode</span>
              </div>
              {theme === 'light' && (
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-dark-muted mb-3">
              Clean, crisp white and light slate surfaces with indigo accents.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-lg bg-[#F8FAFC] border border-slate-200" title="#F8FAFC Background" />
              <div className="w-6 h-6 rounded-lg bg-white border border-slate-200" title="White Card" />
              <div className="w-6 h-6 rounded-lg bg-indigo-600" title="Indigo Accent" />
            </div>
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-950/30 shadow-xs'
                : 'border-slate-200 dark:border-dark-border hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-dark-text">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark Mode (Modern SaaS)</span>
              </div>
              {theme === 'dark' && (
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-dark-muted mb-3">
              Layered deep navy and slate surfaces (#0F172A, #172033) for low-light focus.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-lg bg-[#0F172A] border border-slate-700" title="#0F172A Background" />
              <div className="w-6 h-6 rounded-lg bg-[#172033] border border-slate-700" title="#172033 Card" />
              <div className="w-6 h-6 rounded-lg bg-indigo-600" title="Indigo Accent" />
            </div>
          </button>
        </div>
      </div>

      {/* 4. Danger Zone (Permanent Account Deletion) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-4 transition-colors">
        <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-bold text-base">
          <Trash2 className="w-5 h-5" />
          <span>Danger Zone — Delete Account</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Permanently delete your account, all submitted startup ideas, validation scores, reports, and conversation history. This action cannot be reversed.
        </p>
        <button
          type="button"
          onClick={handleOpenDeleteModal}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
        >
          Delete My Account &amp; Data
        </button>
      </div>

      {/* Delete Account Modal with Identity Verification Flow */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Warning: Irreversible action</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Deleting your account will permanently wipe:
            </p>
            <ul className="text-xs text-slate-600 dark:text-dark-muted space-y-1 pl-4 list-disc">
              <li>Student founder profile &amp; credentials</li>
              <li>All startup ideas &amp; pitch records</li>
              <li>7-parameter validation scores and version reports</li>
              <li>AI advisor chats and messages</li>
            </ul>
          </div>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900/50">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {/* STEP 1: IDENTITY VERIFICATION */}
          {!isIdentityVerified ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-input/60 border border-slate-200 dark:border-dark-border space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-dark-text uppercase tracking-wider">
                  Step 1: Identity Verification Required
                </h4>
              </div>

              {isGoogleUser ? (
                /* Google Re-authentication flow */
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-dark-muted leading-relaxed">
                    To protect your venture data, please re-authenticate with your matching Google account (<strong className="font-mono text-slate-800 dark:text-slate-200">{user?.email}</strong>).
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    We will NEVER request or collect your Google password.
                  </p>

                  <div className="pt-1 flex flex-col items-center gap-2">
                    {verifyLoading ? (
                      <div className="py-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Google Identity...</span>
                      </div>
                    ) : (
                      <>
                        <div ref={googleReauthButtonRef} className="w-full flex justify-center min-h-[44px]" />

                        <button
                          type="button"
                          onClick={() => setGoogleChooserOpen(true)}
                          className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-dark-border hover:bg-slate-100 dark:hover:bg-dark-card text-xs font-bold text-slate-800 dark:text-dark-text flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Re-authenticate with Google</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* LOCAL User Password Verification */
                <form onSubmit={handleVerifyLocalPassword} className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-dark-muted">
                    Please enter your current account password to verify your identity:
                  </p>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showVerifyPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={verifyPassword}
                      onChange={(e) => setVerifyPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="block w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-dark-text text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showVerifyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {verifyLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Verify Current Password</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* STEP 2: CONFIRM KEYWORD "DELETE" */
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Identity Verified Successfully</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                To complete permanent deletion, please type <strong className="text-rose-600 dark:text-rose-400 font-mono">DELETE</strong> in capital letters:
              </p>
              <input
                type="text"
                autoFocus
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-input text-xs text-slate-900 dark:text-dark-text font-mono focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-dark-border">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-semibold text-slate-700 dark:text-dark-muted hover:bg-slate-50 dark:hover:bg-dark-input transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={!isIdentityVerified || deleteConfirmationText !== 'DELETE' || deleteLoading}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs disabled:opacity-40 flex items-center gap-2 cursor-pointer transition"
            >
              {deleteLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Delete My Account</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Fallback Google Chooser Modal for Danger Zone */}
      <GoogleAccountChooserModal
        isOpen={googleChooserOpen}
        onClose={() => setGoogleChooserOpen(false)}
        onSelectAccount={handleFallbackGoogleVerify}
      />
    </div>
  );
};
