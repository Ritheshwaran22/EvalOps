'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import { API_BASE, authFetch } from '@/lib/auth';
import { fetchWithCache } from '@/lib/cache';

type Run = {
  id: number;
  project_id: number;
  status: string;
  trigger: string;
  revision: string | null;
  baseline_run_id: number | null;
  total: number;
  passed: number;
  failed: number;
  duration_ms: number;
  gate_passed: boolean | null;
  gate_reasons: string[];
  created_at: string;
};

export default function Runs() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [projects, setProjects] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail' | 'inconclusive'>('all');

  async function load(force = false) {
    setLoading(true);
    setError('');
    try {
      const [rs, ps] = await Promise.all([
        fetchWithCache<Run[]>(
          `${API_BASE}/runs?limit=100`,
          () => authFetch(`${API_BASE}/runs?limit=100`),
          { force }
        ),
        fetchWithCache<{ id: number; name: string }[]>(
          `${API_BASE}/projects`,
          () => authFetch(`${API_BASE}/projects`),
          { force }
        ),
      ]);
      setRuns(rs);
      setProjects(Object.fromEntries(ps.map((x) => [x.id, x.name])));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load evaluation runs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const shown = runs.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'pass') return r.gate_passed === true;
    if (filter === 'fail') return r.gate_passed === false && r.status !== 'inconclusive';
    if (filter === 'inconclusive') return r.status === 'inconclusive';
    return true;
  });

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="shell py-9 md:py-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow mb-3">Workspace / Evaluations</div>
              <h1 className="text-3xl tracking-tight">Evaluation runs</h1>
              <p className="mt-2 text-sm text-zinc-500">
                Persisted test executions, release decisions, and baseline comparisons.
              </p>
            </div>
            <button className="button" onClick={() => void load(true)}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {error && (
            <div role="alert" className="mt-6 border border-rose-900 bg-rose-950/20 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-2">
            {[
              ['all', 'All runs'],
              ['pass', 'Gate passed'],
              ['fail', 'Gate failed'],
              ['inconclusive', 'Inconclusive'],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v as any)}
                className={`button ${filter === v ? 'border-violet/70 bg-violet/10 text-white font-medium' : ''}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="panel mt-5">
            {loading ? (
              <div className="p-8 text-sm text-zinc-500">Loading runs…</div>
            ) : shown.length === 0 ? (
              <div className="p-12 text-center">
                <h2 className="text-base font-medium">No matching evaluation runs</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Runs appear here after you execute a project evaluation. EvalOps never fills this history with sample activity.
                </p>
                <Link href="/projects" className="button button-primary mt-5">
                  Open projects <ArrowUpRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Run</th>
                      <th>Project</th>
                      <th>Release Gate</th>
                      <th>Status</th>
                      <th>Results</th>
                      <th>Duration</th>
                      <th>Trigger</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => (
                      <tr key={r.id}>
                        <td className="mono font-medium text-zinc-200">#{r.id}</td>
                        <td>{projects[r.project_id] || `Project ${r.project_id}`}</td>
                        <td>
                          <span
                            className={`status ${
                              r.gate_passed === true ? 'status-pass' : 'status-fail'
                            }`}
                          >
                            {r.gate_passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status ${
                              r.status === 'inconclusive'
                                ? 'status-inconclusive'
                                : 'status-neutral'
                            }`}
                          >
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className="text-zinc-200">{r.passed}</span>
                          <span className="text-zinc-500">/{r.total} passed</span>
                          {r.failed > 0 && <span className="ml-1 text-rose-300">({r.failed} failed)</span>}
                        </td>
                        <td className="mono text-zinc-400">{r.duration_ms.toFixed(1)} ms</td>
                        <td className="text-zinc-400 capitalize">{r.trigger}</td>
                        <td className="text-zinc-500">{new Date(r.created_at).toLocaleString()}</td>
                        <td>
                          <Link
                            className="inline-flex items-center gap-1 text-xs text-violet hover:underline"
                            href={`/runs/${r.id}`}
                          >
                            Details <ArrowUpRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
