'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Trash2, GitCompareArrows } from 'lucide-react';
import { API_BASE, authFetch } from '@/lib/auth';

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

type Result = {
  id: number;
  test_name: string;
  status: string;
  passed: boolean;
  input_text: string;
  expected_output: string | null;
  actual_output: string | null;
  checks: { name: string; passed: boolean; detail: string }[];
  errors: string[];
  latency_ms: number | null;
  token_count: number | null;
  token_count_kind: string | null;
  regression: string;
  baseline_passed: boolean | null;
};

export default function RunDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [a, b] = await Promise.all([
          authFetch(`${API_BASE}/runs/${id}`),
          authFetch(`${API_BASE}/runs/${id}/results`),
        ]);
        if (!a.ok || !b.ok) throw new Error('Run not found or API unavailable');
        setRun(await a.json());
        setResults(await b.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load run');
      }
    })();
  }, [id]);

  async function handleDeleteRun() {
    if (!window.confirm('Delete this evaluation run and all its stored test results?')) return;
    setDeleting(true);
    try {
      const res = await authFetch(`${API_BASE}/runs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete run');
      router.push('/runs');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deletion failed');
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="shell py-9 md:py-12">
          <div className="flex items-center justify-between mb-6">
            <Link href="/runs" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300">
              <ArrowLeft size={13} /> Evaluation runs
            </Link>
            {run && (
              <button
                onClick={handleDeleteRun}
                disabled={deleting}
                className="button text-xs text-rose-300 hover:border-rose-800"
              >
                <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete Run'}
              </button>
            )}
          </div>

          {error && (
            <div role="alert" className="border border-rose-900 bg-rose-950/20 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {run && (
            <>
              <div className="eyebrow mb-3">Evaluation / Run #{run.id}</div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl tracking-tight">Run #{run.id}</h1>
                  <p className="mt-2 text-sm text-zinc-500">
                    Project {run.project_id} · Trigger: {run.trigger} · {new Date(run.created_at).toLocaleString()}
                    {run.baseline_run_id ? (
                      <span className="ml-2 inline-flex items-center gap-1 text-zinc-400">
                        · Compared against Baseline #{run.baseline_run_id}
                      </span>
                    ) : (
                      <span className="ml-2 text-zinc-600">· No baseline comparison</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`status ${
                      run.status === 'inconclusive'
                        ? 'status-inconclusive'
                        : 'status-neutral'
                    }`}
                  >
                    RUN: {run.status.toUpperCase()}
                  </span>
                  <span
                    className={`status ${
                      run.gate_passed === true
                        ? 'status-pass'
                        : 'status-fail'
                    }`}
                  >
                    {run.gate_passed ? 'GATE PASSED' : 'GATE FAILED'}
                  </span>
                </div>
              </div>

              {/* Metric stats */}
              <div className="mt-7 grid gap-3 sm:grid-cols-4">
                {[
                  ['Total cases', run.total],
                  ['Passed', run.passed],
                  ['Failed', run.failed],
                  ['Duration', `${run.duration_ms.toFixed(1)} ms`],
                ].map(([a, b]) => (
                  <div className="panel p-4" key={a}>
                    <div className="text-xs text-zinc-500">{a}</div>
                    <div className="mt-3 text-2xl font-mono">{b}</div>
                  </div>
                ))}
              </div>

              {run.gate_reasons.length > 0 && (
                <div className="mt-5 border border-rose-900/70 bg-rose-950/10 p-4">
                  <h2 className="text-sm font-medium text-rose-200">Release gate findings</h2>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-200/90">
                    {run.gate_reasons.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}

              <h2 className="mb-4 mt-9 text-xl">Test results</h2>
              <div className="space-y-4">
                {results.map((r) => {
                  const isResultInconclusive = r.status === 'inconclusive' || r.actual_output === null;
                  return (
                    <article key={r.id} className="panel p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-base">{r.test_name}</h3>
                            <span
                              className={`status ${
                                isResultInconclusive
                                  ? 'status-inconclusive'
                                  : r.passed
                                  ? 'status-pass'
                                  : 'status-fail'
                              }`}
                            >
                              {isResultInconclusive ? 'INCONCLUSIVE' : r.passed ? 'PASS' : 'FAIL'}
                            </span>

                            {/* Baseline regression comparison tag */}
                            {r.regression === 'regression' && (
                              <span className="status status-fail">
                                REGRESSION
                              </span>
                            )}
                            {r.regression === 'improvement' && (
                              <span className="status status-pass">
                                IMPROVEMENT
                              </span>
                            )}
                            {r.regression === 'unchanged' && r.baseline_passed !== null && (
                              <span className="status status-neutral">
                                UNCHANGED
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-zinc-500">
                            Latency:{' '}
                            {r.latency_ms === null ? 'unavailable' : `${r.latency_ms.toFixed(1)} ms`} · Token count:{' '}
                            {r.token_count === null
                              ? 'unavailable'
                              : `${r.token_count} ${r.token_count_kind === 'estimated' ? 'estimated tokens' : 'tokens'}`}{' '}
                            · Baseline:{' '}
                            {r.baseline_passed === null
                              ? 'not compared'
                              : r.baseline_passed
                              ? 'passed'
                              : 'failed'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="border border-line p-3">
                          <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">
                            Expected output
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-zinc-300">
                            {r.expected_output || 'Not specified'}
                          </pre>
                        </div>
                        <div className="border border-line p-3">
                          <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">
                            Actual output
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-zinc-300">
                            {r.actual_output ?? 'No actual output supplied'}
                          </pre>
                        </div>
                      </div>

                      {r.checks.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {r.checks.map((c, i) => (
                            <div
                              key={i}
                              className="flex flex-wrap items-start justify-between gap-2 border-b border-line py-2 text-xs last:border-0"
                            >
                              <span className={c.passed ? 'text-emerald-200' : 'text-rose-200'}>
                                {c.passed ? 'PASS' : 'FAIL'} · {c.name}
                              </span>
                              <span className="max-w-xl text-zinc-500">{c.detail}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {r.errors.length > 0 && (
                        <div className="mt-4 text-xs leading-5 text-rose-200">
                          {r.errors.join(' · ')}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
