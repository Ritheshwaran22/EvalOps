'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { RefreshCw, ArrowUpRight, GitCompareArrows } from 'lucide-react';
import { API_BASE, authFetch } from '@/lib/auth';
import { fetchWithCache } from '@/lib/cache';

type Project = { id: number; name: string };
type Finding = {
  run_id: number;
  result_id: number;
  test_name: string;
  errors: string[];
  baseline_passed: boolean | null;
  current_passed: boolean;
  latency_ms: number | null;
};

export default function Regressions() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [findings, setFindings] = useState<(Finding & { project_id: number; project_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(force = false) {
    setLoading(true);
    setError('');
    try {
      const [ps, allFindings] = await Promise.all([
        fetchWithCache<Project[]>(
          `${API_BASE}/projects`,
          () => authFetch(`${API_BASE}/projects`),
          { force }
        ),
        fetchWithCache<(Finding & { project_id: number; project_name: string })[]>(
          `${API_BASE}/regressions`,
          () => authFetch(`${API_BASE}/regressions`),
          { force }
        ),
      ]);
      setProjects(ps);
      setFindings(allFindings);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'API unavailable');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="shell py-9 md:py-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow mb-3">Workspace / Regression reports</div>
              <h1 className="text-3xl tracking-tight">Regression reports</h1>
              <p className="mt-2 text-sm text-zinc-500">
                Newly failing test cases and performance regressions compared against baseline runs.
              </p>
            </div>
            <button className="button" onClick={() => void load(true)}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {error && (
            <div role="alert" className="mt-5 border border-rose-900 bg-rose-950/20 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="panel mt-7">
            {loading ? (
              <div className="p-8 text-sm text-zinc-500">Loading regression findings…</div>
            ) : findings.length === 0 ? (
              <div className="p-12 text-center">
                <GitCompareArrows size={26} className="mx-auto text-zinc-600 mb-3" />
                <h2 className="text-base font-medium">No confirmed regressions</h2>
                <p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-zinc-500">
                  No stored baseline comparison currently classifies a test case as a regression. Runs evaluated without a
                  baseline remain uncompared rather than being falsely flagged as regressions.
                </p>
                <Link href="/projects" className="button mt-5">
                  Open projects <ArrowUpRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Test case</th>
                      <th>Project</th>
                      <th>Baseline</th>
                      <th>Current</th>
                      <th>Latency</th>
                      <th>Reason / Error</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.map((f) => (
                      <tr key={`${f.run_id}-${f.result_id}`}>
                        <td className="font-medium text-zinc-200">
                          {f.test_name}
                          <div className="mt-1 text-xs text-zinc-500 mono">Run #{f.run_id}</div>
                        </td>
                        <td>{f.project_name}</td>
                        <td>
                          <span className="status status-pass">Passed</span>
                        </td>
                        <td>
                          <span className="status status-fail">Failed</span>
                        </td>
                        <td className="mono text-zinc-400">
                          {f.latency_ms === null ? '—' : `${f.latency_ms.toFixed(1)} ms`}
                        </td>
                        <td className="max-w-xs truncate text-xs text-rose-200">
                          {f.errors.join('; ') || 'Previously passing case failed'}
                        </td>
                        <td>
                          <Link
                            className="inline-flex items-center gap-1 text-xs text-violet hover:underline"
                            href={`/runs/${f.run_id}`}
                          >
                            Inspect <ArrowUpRight size={12} />
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
