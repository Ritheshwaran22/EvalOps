'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Plus, RefreshCw, FolderKanban, ArrowUpRight } from 'lucide-react';
import { API_BASE, authFetch } from '@/lib/auth';
import { fetchWithCache, invalidateCache } from '@/lib/cache';

type Project = {
  id: number;
  name: string;
  description: string;
  config: Record<string, unknown>;
  created_at: string;
};

export default function Projects() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load(force = false) {
    setLoading(true);
    setError('');
    try {
      const data = await fetchWithCache<Project[]>(
        `${API_BASE}/projects`,
        () => authFetch(`${API_BASE}/projects`),
        { force }
      );
      setItems(data);
    } catch (e) {
      setError(`Could not load projects. Check backend status. ${e instanceof Error ? e.message : ''}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const r = await authFetch(`${API_BASE}/projects`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          config: { gate: { no_critical_failures: true, min_pass_rate: 1 } },
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || `API returned ${r.status}`);
      setName('');
      setDescription('');
      setShow(false);
      invalidateCache('/projects');
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="shell py-9 md:py-12">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="eyebrow mb-3">Workspace / Projects</div>
              <h1 className="text-3xl tracking-tight">Projects</h1>
              <p className="mt-2 text-sm text-zinc-500">
                Manage evaluation suites, configure release criteria, and inspect runs.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void load(true)} className="button" aria-label="Refresh projects">
                <RefreshCw size={14} /> Refresh
              </button>
              <button onClick={() => setShow(!show)} className="button button-primary">
                <Plus size={14} /> Create project
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-6 border border-rose-900 bg-rose-950/20 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {show && (
            <form onSubmit={create} className="panel mt-7 max-w-2xl p-5">
              <h2 className="mb-4 text-lg font-medium">New project</h2>
              <label className="mb-2 block text-xs text-zinc-400">Project name</label>
              <input
                className="field mb-4"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                required
                placeholder="Customer support assistant"
              />
              <label className="mb-2 block text-xs text-zinc-400">Description</label>
              <textarea
                className="field mb-4 min-h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={4000}
                placeholder="What behavior should this suite protect?"
              />
              <p className="mb-4 text-xs leading-5 text-zinc-500">
                Default gate requires 100% pass rate. Test cases run deterministically without third-party API dependencies.
              </p>
              <div className="flex gap-2">
                <button disabled={saving} className="button button-primary" type="submit">
                  {saving ? 'Creating…' : 'Create project'}
                </button>
                <button type="button" onClick={() => setShow(false)} className="button">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="panel mt-7">
            <div className="border-b border-line px-5 py-4 text-sm font-medium">
              All projects <span className="ml-2 text-xs text-zinc-500 font-mono">({items.length})</span>
            </div>
            {loading ? (
              <div className="p-8 text-sm text-zinc-500">Loading projects…</div>
            ) : items.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                <FolderKanban size={24} className="text-zinc-600" />
                <h2 className="mt-4 text-base font-medium">No projects yet</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                  Create your first evaluation project, then add test cases and run checks against explicit outputs.
                </p>
                <button onClick={() => setShow(true)} className="button button-primary mt-5">
                  <Plus size={14} /> Create project
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Configuration</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="font-medium text-zinc-200">{p.name}</div>
                          <div className="mt-1 max-w-sm truncate text-xs text-zinc-500">
                            {p.description || 'No description provided'}
                          </div>
                        </td>
                        <td className="text-zinc-400">
                          {Object.keys(p.config || {}).length ? 'Configured gate' : 'Default gate'}
                        </td>
                        <td className="text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td>
                          <Link
                            href={`/projects/${p.id}`}
                            className="inline-flex items-center gap-1 text-xs text-violet hover:underline"
                          >
                            Open <ArrowUpRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="mt-5 text-xs text-zinc-600">
            Projects are isolated to your authenticated account.
          </p>
        </div>
      </main>
    </div>
  );
}
