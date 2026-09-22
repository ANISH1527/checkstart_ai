import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { Rocket, Eye, EyeOff, CheckCircle2, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      const code = err.code || err.status || '';
      if (code === 'unauthorized' || err.status === 401) {
        toast.error('Wrong email or password');
        setErrorMessage('Wrong email or password.');
      } else if (code === 'rate_limit_exceeded' || err.status === 429) {
        toast.error('Too many attempts. Please wait a minute.');
        setErrorMessage('Too many login attempts. Please wait a minute before trying again.');
      } else {
        toast.error(err.message || 'Login failed');
        setErrorMessage(err.message || 'Unable to sign in. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-gray-900">
      {/* Left Panel - Indigo Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative Circle Gradients */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-700/50 rounded-full blur-3xl pointer-events-none" />

        {/* Logo Header */}
        <div className="flex items-center space-x-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-lg">
            <Rocket className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">IdeaValidator AI</span>
        </div>

        {/* Quote & Value Props */}
        <div className="z-10 my-auto max-w-md">
          <h2 className="text-3xl font-black leading-tight mb-8 text-indigo-50">
            "A great idea validated early saves years of wasted effort."
          </h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 text-sm font-medium text-indigo-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Get an honest AI score in under 2 minutes</span>
            </div>
            <div className="flex items-start space-x-3 text-sm font-medium text-indigo-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Know exactly what to fix before pitching</span>
            </div>
            <div className="flex items-start space-x-3 text-sm font-medium text-indigo-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Track improvement across version iterations</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-indigo-200 z-10">
          © {new Date().getFullYear()} IdeaValidator AI. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Rocket className="w-5 h-5" />
            </div>
            <span className="font-black text-xl text-gray-900">IdeaValidator AI</span>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Sign in</h1>
            <p className="text-sm text-gray-500 mt-2">Enter your credentials to access your validation dashboard</p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pl-11 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-6 py-3.5 text-sm shadow-md shadow-indigo-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Link to Register */}
          <div className="mt-8 text-center text-xs text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800 transition">
              Create one free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
