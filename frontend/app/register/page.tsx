'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Hexagon, ArrowRight } from 'lucide-react';
import { API_BASE, setSession } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed. Please check your information.');
      }

      setSession(data.token, data.user);
      router.push('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Link href="/" className="mb-8 flex items-center gap-2 text-base font-semibold tracking-tight">
        <Hexagon size={22} className="text-violet" /> EvalOps
      </Link>

      <div className="panel w-full max-w-md p-8">
        <div className="eyebrow mb-2">Create Workspace</div>
        <h1 className="text-2xl font-medium tracking-tight">Create your account</h1>
        <p className="mt-2 text-xs leading-5 text-zinc-400">
          Set up an isolated workspace for deterministic evaluation suites and release gates.
        </p>

        {error && (
          <div role="alert" className="mt-5 border border-rose-900 bg-rose-950/30 p-3 text-xs leading-5 text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-300" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="field"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-300" htmlFor="email">
              Work email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="field"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-300" htmlFor="password">
              Password (min. 8 characters)
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="field"
            />
          </div>

          <p className="pt-2 text-[11px] leading-4 text-zinc-500">
            By registering, you acknowledge our{' '}
            <Link href="/privacy" className="text-zinc-400 underline">Privacy Policy</Link> and{' '}
            <Link href="/terms" className="text-zinc-400 underline">Terms of Service</Link>.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="button button-primary mt-4 w-full py-3"
          >
            {loading ? 'Creating account…' : 'Create account'} <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 border-t border-line pt-5 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-violet hover:underline">
            Sign in
          </Link>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-zinc-600 space-y-2">
        <div>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link> ·{' '}
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </div>
        <div>© 2026 EvalOps. All rights reserved.</div>
      </div>
    </div>
  );
}
