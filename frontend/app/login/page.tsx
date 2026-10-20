'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Hexagon, ArrowRight } from 'lucide-react';
import { API_BASE, setSession } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/projects';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data && data.detail) || `Authentication failed (HTTP ${res.status}).`);
      }

      setSession(data.token, data.user);
      router.push(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel w-full max-w-md p-8">
      <div className="eyebrow mb-2">Workspace Access</div>
      <h1 className="text-2xl font-medium tracking-tight">Sign in to EvalOps</h1>
      <p className="mt-2 text-xs leading-5 text-zinc-400">
        Deterministic evaluation suites, regression reports, and release gates.
      </p>

      {error && (
        <div role="alert" className="mt-5 border border-rose-900 bg-rose-950/30 p-3 text-xs leading-5 text-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-300" htmlFor="email">
            Email address
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
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-medium text-zinc-300" htmlFor="password">
              Password
            </label>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="field"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="button button-primary mt-6 w-full py-3"
        >
          {loading ? 'Authenticating…' : 'Sign in'} <ArrowRight size={14} />
        </button>
      </form>

      <div className="mt-6 border-t border-line pt-5 text-center text-xs text-zinc-500">
        Don't have an account yet?{' '}
        <Link href="/register" className="text-violet hover:underline">
          Register for workspace
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Link href="/" className="mb-8 flex items-center gap-2 text-base font-semibold tracking-tight">
        <Hexagon size={22} className="text-violet" /> EvalOps
      </Link>

      <Suspense fallback={<div className="panel w-full max-w-md p-8 text-center text-sm text-zinc-500">Loading sign in…</div>}>
        <LoginForm />
      </Suspense>

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
