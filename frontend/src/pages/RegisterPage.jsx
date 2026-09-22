import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { Rocket, Eye, EyeOff, CheckCircle2, User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Full name is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address (e.g. user@domain.com)';
    }
    if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (!agreeTerms) {
      errs.agreeTerms = 'You must agree to the Terms of Service';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      await register(name, email, password);
      toast.success('Welcome! Your account is ready.');
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      if (err.code === 'validation_error' && err.details) {
        setErrors(err.details);
      } else {
        toast.error(err.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-gray-900">
      {/* Left Panel - Indigo Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 text-white flex-col justify-between p-12 relative overflow-hidden">
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

        <div className="text-xs text-indigo-200 z-10">
          © {new Date().getFullYear()} IdeaValidator AI. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Register Form */}
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
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-sm text-gray-500 mt-2">Validate your startup ideas free in 2 minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={`w-full border rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none transition ${
                    errors.name ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
                <User className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full border rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none transition ${
                    errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password (min 8 chars)
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border rounded-xl px-4 py-3 pl-11 pr-11 text-sm focus:outline-none transition ${
                    errors.password ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                  }`}
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
              {errors.password && <p className="text-xs text-red-500 mt-1 font-medium">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border rounded-xl px-4 py-3 pl-11 pr-11 text-sm focus:outline-none transition ${
                    errors.confirmPassword ? 'border-red-400 focus:ring-2 focus:ring-red-400' : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 font-medium">{errors.confirmPassword}</p>}
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start space-x-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5"
                />
                <span>
                  I agree to the <a href="#" className="text-indigo-600 font-semibold hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 font-semibold hover:underline">Privacy Policy</a>
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-red-500 mt-1 font-medium">{errors.agreeTerms}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-6 py-3.5 text-sm shadow-md shadow-indigo-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create my free account</span>
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="mt-8 text-center text-xs text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800 transition">
              Log in →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
