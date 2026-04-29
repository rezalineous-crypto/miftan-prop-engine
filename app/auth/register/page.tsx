'use client';

import { useState } from 'react';
import { useAuth } from '../context';
import { useRouter } from 'next/navigation';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password_hash: '',
    full_name: '',
    role_id: 1,
    is_super_admin: false,
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
      router.push('/auth/login');
    } catch {
      setError('Registration failed. Please check your details and try again.');
    }
  };

  const passwordStrength = (() => {
    const p = formData.password_hash;
    if (!p) return null;
    if (p.length < 6) return { level: 1, label: 'Weak', color: 'bg-red-400' };
    if (p.length < 10) return { level: 2, label: 'Fair', color: 'bg-amber-400' };
    return { level: 3, label: 'Strong', color: 'bg-emerald-500' };
  })();

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#0f1117] relative overflow-hidden flex-col justify-between p-12">
        {/* Ambient glows */}
        <div className="absolute -top-48 -left-48 w-130 h-130 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-95 h-95 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/3 w-75 h-75 bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ChartBarIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-white font-semibold text-base tracking-tight font-headline">
              MIFTAN Analytics
            </span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              Secure · Enterprise-grade
            </span>
          </div>

          <h2 className="text-[2.6rem] font-bold text-white font-headline leading-[1.2] mb-5">
            Your workspace,<br />
            <span className="text-indigo-400">ready in seconds.</span>
          </h2>

          <p className="text-slate-400 text-[0.9375rem] leading-relaxed max-w-85">
            Join property teams who rely on MIFTAN for portfolio diagnostics, performance tracking, and data-driven reporting.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-3">
            {[
              'Unified portfolio dashboard',
              'Automated performance diagnostics',
              'Real-time upload & report management',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-indigo-500/20 border border-indigo-500/30 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircleIcon className="w-3 h-3 text-indigo-400" />
                </div>
                <span className="text-slate-400 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-slate-600 text-xs">
          <BuildingOffice2Icon className="w-3.5 h-3.5" />
          <span>© 2026 MIFTAN Systems. All rights reserved.</span>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile nav */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 font-semibold text-sm">MIFTAN</span>
          </div>
          <a href="#" className="text-sm text-gray-400 hover:text-indigo-600 transition-colors">
            Help
          </a>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-90">
            <div className="mb-8">
              <h1 className="text-[1.6rem] font-bold text-gray-900 font-headline mb-1 tracking-tight">
                Create your account
              </h1>
              <p className="text-sm text-gray-400">
                Get started with your analytics workspace
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-3.5 py-3 rounded-lg">
                  <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label
                  className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase"
                  htmlFor="full_name"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  placeholder="Jane Smith"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label
                  className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  placeholder="you@company.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label
                  className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide uppercase"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password_hash}
                    onChange={(e) => setFormData({ ...formData, password_hash: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-300 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    placeholder="Min. 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Strength indicator */}
                {passwordStrength && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i <= passwordStrength.level
                              ? passwordStrength.color
                              : 'bg-gray-100'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{passwordStrength.label}</span>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-indigo-100 mt-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4 opacity-80"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-400 pt-1">
                Already have an account?{' '}
                <a
                  href="/auth/login"
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  Sign in
                </a>
              </p>
            </form>
          </div>
        </div>

        {/* Desktop footer */}
        <div className="hidden lg:flex items-center justify-between px-12 py-4 border-t border-gray-100 text-[0.7rem] text-gray-300">
          <span>© 2026 MIFTAN Systems</span>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-gray-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-500 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
