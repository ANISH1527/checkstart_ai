import React, { useState, useEffect } from 'react';
import { User, UserPlus, X, ChevronDown, ArrowRight, Loader2, Lock } from 'lucide-react';

export interface GoogleAccountProfile {
  name: string;
  email: string;
  avatarLetter?: string;
  avatarBg?: string;
  avatarImage?: string;
  college?: string;
  course?: string;
}

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: GoogleAccountProfile) => Promise<void>;
}

const DEFAULT_ACCOUNTS: GoogleAccountProfile[] = [
  {
    name: 'Anish 007',
    email: 'benseries7@gmail.com',
    avatarLetter: 'A',
    avatarBg: 'bg-sky-600',
    college: 'Bannari Amman Institute of Technology',
    course: 'Computer Science & Engineering',
  },
];

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [savedAccounts, setSavedAccounts] = useState<GoogleAccountProfile[]>(DEFAULT_ACCOUNTS);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);

  // Load any previously used Google accounts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ai_validate_google_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAccounts(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  if (!isOpen) return null;

  const currentHost =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : 'bitsathy.ac.in';

  const handleAccountClick = async (account: GoogleAccountProfile) => {
    setLoadingEmail(account.email);
    try {
      await onSelectAccount(account);
    } finally {
      setLoadingEmail(null);
    }
  };

  const handleAddNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const emailClean = newEmail.trim().toLowerCase();
    const nameClean = newName.trim() || emailClean.split('@')[0];
    const letter = nameClean.charAt(0).toUpperCase();

    const newAccount: GoogleAccountProfile = {
      name: nameClean,
      email: emailClean,
      avatarLetter: letter,
      avatarBg: 'bg-emerald-600',
      college: 'bitsathy.ac.in',
      course: 'Engineering & Innovation',
    };

    const updated = [newAccount, ...savedAccounts.filter((a) => a.email !== emailClean)];
    setSavedAccounts(updated);
    try {
      localStorage.setItem('ai_validate_google_accounts', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setLoadingEmail(emailClean);
    try {
      await onSelectAccount(newAccount);
    } finally {
      setLoadingEmail(null);
      setIsAddingAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      {/* Chrome Style Window */}
      <div className="relative w-full max-w-[440px] bg-[#1f1f1f] text-[#e3e3e3] rounded-3xl shadow-2xl border border-[#333538] overflow-hidden flex flex-col min-h-[540px]">
        {/* Top Window Bar */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Google Colorful G Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span className="text-xs font-medium text-[#c4c7c5]">Sign in with Google</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8e918f] hover:text-white hover:bg-[#333538] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="px-8 py-4 flex-1 flex flex-col">
          {!isAddingAccount ? (
            <>
              {/* Heading */}
              <div className="mb-6">
                <h2 className="text-2xl font-normal text-white tracking-tight">
                  Choose an account
                </h2>
                <p className="text-xs text-[#c4c7c5] mt-1">
                  to continue to{' '}
                  <span className="font-semibold text-white">{currentHost}</span>
                </p>
              </div>

              {/* Account List */}
              <div className="space-y-1 divide-y divide-[#333538] border-t border-b border-[#333538]">
                {savedAccounts.map((account) => {
                  const isLoadingThis = loadingEmail === account.email;
                  return (
                    <button
                      key={account.email}
                      type="button"
                      disabled={loadingEmail !== null}
                      onClick={() => handleAccountClick(account)}
                      className="w-full flex items-center gap-3.5 py-3.5 px-2 hover:bg-[#2b2b2b] rounded-xl text-left transition group disabled:opacity-50"
                    >
                      {/* Avatar Circle */}
                      <div
                        className={`w-9 h-9 rounded-full ${
                          account.avatarBg || 'bg-sky-600'
                        } text-white font-medium flex items-center justify-center text-sm shadow-sm flex-shrink-0`}
                      >
                        {isLoadingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          account.avatarLetter || account.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-sky-300 transition truncate">
                          {account.name}
                        </p>
                        <p className="text-xs text-[#8e918f] truncate font-mono">
                          {account.email}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {/* Use Another Account Button */}
                <button
                  type="button"
                  disabled={loadingEmail !== null}
                  onClick={() => setIsAddingAccount(true)}
                  className="w-full flex items-center gap-3.5 py-3.5 px-2 hover:bg-[#2b2b2b] rounded-xl text-left transition group"
                >
                  <div className="w-9 h-9 rounded-full bg-[#333538] text-[#c4c7c5] flex items-center justify-center flex-shrink-0 group-hover:text-white transition">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e3e3e3] group-hover:text-white">
                      Use another account
                    </p>
                  </div>
                </button>
              </div>

              {/* Security Note */}
              <div className="mt-8 text-[11px] text-[#8e918f] leading-relaxed">
                To continue, Google will share your name, email address, language preference, and profile picture with {currentHost}.
              </div>
            </>
          ) : (
            /* Add Account Form inside Google modal */
            <div className="space-y-4 my-auto">
              <div>
                <h2 className="text-2xl font-normal text-white tracking-tight">
                  Sign in
                </h2>
                <p className="text-xs text-[#c4c7c5] mt-1">
                  with your Google Account to continue to{' '}
                  <span className="font-semibold text-white">{currentHost}</span>
                </p>
              </div>

              <form onSubmit={handleAddNewAccount} className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#c4c7c5] mb-1">
                    Email or phone
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter your Google email"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#505256] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#c4c7c5] mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Anish"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#505256] bg-[#1a1a1a] text-white text-xs sm:text-sm focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingAccount(false)}
                    className="text-xs text-[#8ab4f8] hover:text-[#aecbfa] font-medium"
                  >
                    Back to accounts
                  </button>
                  <button
                    type="submit"
                    disabled={loadingEmail !== null}
                    className="px-5 py-2 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#041e49] font-medium text-xs shadow transition flex items-center gap-1.5"
                  >
                    {loadingEmail ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Next</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Footer matching Google */}
        <div className="px-8 py-3.5 border-t border-[#333538] flex items-center justify-between text-[11px] text-[#8e918f] bg-[#171717]">
          <div className="flex items-center gap-1 cursor-pointer hover:text-[#c4c7c5]">
            <span>English (United Kingdom)</span>
            <ChevronDown className="w-3 h-3" />
          </div>

          <div className="flex items-center gap-4">
            <span className="cursor-pointer hover:text-[#c4c7c5]">Help</span>
            <span className="cursor-pointer hover:text-[#c4c7c5]">Privacy</span>
            <span className="cursor-pointer hover:text-[#c4c7c5]">Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
