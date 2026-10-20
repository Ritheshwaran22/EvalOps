'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import { API_BASE, authFetch } from '@/lib/auth';
import { fetchWithCache } from '@/lib/cache';

type Project = { id: number; name: string };
type Case = {
  id: number;
  project_id: number;
  name: string;
  description: string;
  input_text: string;
  expected_output: string | null;
  criteria: { type: string }[];
  tags: string[];
};

export default function TestCases() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(force = false) {
    setLoading(true);
    try {
      const [ps, allCases] = await Promise.all([
        fetchWithCache<Project[]>(
          `${API_BASE}/projects`,
          () => authFetch(`${API_BASE}/projects`),
          { force }
        ),
        fetchWithCache<Case[]>(
          `${API_BASE}/test-cases`,
          () => authFetch(`${API_BASE}/test-cases`),
          { force }
        ),
      ]);
      setProjects(ps);
      setCases(allCases);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'API unavailable');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const shown = cases.filter((c) => filter === 'all' || String(c.project_id) === filter);

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="shell py-9 md:py-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow mb-3">Workspace / Test cases</div>
              <h1 className="text-3xl tracking-tight">Test cases</h1>
              <p className="mt-2 text-sm text-zinc-500">
                Browse assertions and deterministic expected outputs across your projects.
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

          <div className="mt-7 max-w-xs">
            <label className="mb-2 block text-xs text-zinc-500 font-medium">Project filter</label>
            <select className="field" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="panel mt-5">
            {loading ? (
              <div className="p-8 text-sm text-zinc-500">Loading test cases…</div>
            ) : shown.length === 0 ? (
              <div className="p-10 text-sm text-zinc-500 text-center">
                No test cases found. Open a project to create test cases.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Test case</th>
                      <th>Project</th>
                      <th>Criteria</th>
                      <th>Input</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="font-medium text-zinc-200">{c.name}</div>
                          <div className="mt-1 text-xs text-zinc-600 mono">Case #{c.id}</div>
                        </td>
                        <td>{projects.find((p) => p.id === c.project_id)?.name || `Project ${c.project_id}`}</td>
                        <td className="text-zinc-400">{c.criteria.map((x) => x.type).join(', ') || 'No criteria'}</td>
                        <td className="max-w-[260px] truncate text-zinc-500">{c.input_text}</td>
                        <td>
                          <Link
                            href={`/projects/${c.project_id}`}
                            className="inline-flex items-center gap-1 text-xs text-violet hover:underline"
                          >
                            Open <ArrowUpRight size={12} />
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
