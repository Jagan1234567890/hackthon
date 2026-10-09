'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      setUser(data.user, data.accessToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[oklch(0.02_0_0)] relative overflow-hidden">
      {/* Background ambient radial gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.35_0.2_295/0.3),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_295/20%)] border border-[oklch(0.62_0.22_295/50%)] flex items-center justify-center text-[oklch(0.62_0.22_295)] group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              KEYHOLE
            </span>
          </Link>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-sm text-[oklch(0.66_0.015_280)] mt-1">
            Dual-storage authenticated access with clean-slate privacy
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.11_0.008_280)] hover:bg-[oklch(0.15_0.01_280)] text-white text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17.4C3.7 21.1 7.5 24 12 24z"
                />
              </svg>
              <span>Sign in with Google</span>
            </a>

            <a
              href="/api/auth/github"
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.11_0.008_280)] hover:bg-[oklch(0.15_0.01_280)] text-white text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Sign in with GitHub</span>
            </a>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[oklch(0.22_0.01_280/50%)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[oklch(0.08_0.005_280)] px-3 text-[oklch(0.66_0.015_280)] font-mono">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.66_0.015_280)] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[oklch(0.66_0.015_280)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@keyhole.local"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/60%)] text-white text-sm placeholder-[oklch(0.66_0.015_280)] focus:outline-none focus:border-[oklch(0.62_0.22_295)]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[oklch(0.66_0.015_280)]">
                  Password
                </label>
                <Link
                  href="/login?forgot=1"
                  className="text-xs text-[oklch(0.62_0.22_295)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[oklch(0.66_0.015_280)]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/60%)] text-white text-sm placeholder-[oklch(0.66_0.015_280)] focus:outline-none focus:border-[oklch(0.62_0.22_295)]"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-[oklch(0.11_0.008_280)] border-[oklch(0.22_0.01_280)] accent-[oklch(0.62_0.22_295)]"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-xs text-[oklch(0.66_0.015_280)] select-none"
              >
                Remember me (keep session active for 7 days)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[oklch(0.62_0.22_295)] to-purple-600 text-white text-sm font-semibold hover:brightness-110 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-[oklch(0.66_0.015_280)] mt-6">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-[oklch(0.62_0.22_295)] hover:underline font-medium"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
