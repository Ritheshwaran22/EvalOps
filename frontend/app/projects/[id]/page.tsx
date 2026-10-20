'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { ArrowLeft, Play, Plus, RefreshCw, Trash2, GitCompareArrows } from 'lucide-react';
import { API_BASE, authFetch } from '@/lib/auth';

type Case = {
  id: number;
  name: string;
  description: string;
  input_text: string;
  expected_output: string | null;
  criteria: { type: string; value?: string; fields?: string[]; schema?: object }[];
  tags: string[];
};

type Project = {
  id: number;
  name: string;
  description: string;
  config: Record<string, any>;
};

type BaselineRun = {
  id: number;
  status: string;
  gate_passed: boolean | null;
  passed: number;
  total: number;
  created_at: string;
};

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [baselines, setBaselines] = useState<BaselineRun[]>([]);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('');

  const [err, setErr] = useState('');
  const [form, setForm] = useState(false);
  const [editingCase, setEditingCase] = useState<number | null>(null);

  // Test case fields
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [expected, setExpected] = useState('');
  const [criteria, setCriteria] = useState('exact_match');

  // Evaluation execution state
  const [actual, setActual] = useState('');
  const [runMsg, setRunMsg] = useState<{ id: number; text: string; gate_passed: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [p, c, b] = await Promise.all([
        authFetch(`${API_BASE}/projects/${id}`),
        authFetch(`${API_BASE}/projects/${id}/test-cases`),
        authFetch(`${API_BASE}/projects/${id}/baselines`),
      ]);
      if (!p.ok || !c.ok) throw new Error('Project could not be loaded.');
      setProject(await p.json());
      setCases(await c.json());
      if (b.ok) {
        setBaselines(await b.json());
      }
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'API unavailable');
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function saveProject(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await authFetch(`${API_BASE}/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: projectName, description: projectDescription }),
      });
      if (!r.ok) throw new Error('Could not update project');
      setProjectForm(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not update project');
    }
  }

  async function addCase(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const url = editingCase
        ? `${API_BASE}/test-cases/${editingCase}`
        : `${API_BASE}/projects/${id}/test-cases`;
      const r = await authFetch(url, {
        method: editingCase ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name,
          input_text: input,
          expected_output: expected || null,
          criteria: [{ type: criteria, value: expected }],
          tags: [],
        }),
      });
      if (!r.ok) throw new Error((await r.json()).detail || 'Could not save case');
      setForm(false);
      setEditingCase(null);
      setName('');
      setInput('');
      setExpected('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save test case');
    } finally {
      setBusy(false);
    }
  }

  function editCase(c: Case) {
    setEditingCase(c.id);
    setName(c.name);
    setInput(c.input_text);
    setExpected(c.expected_output || '');
    setCriteria(c.criteria[0]?.type || 'exact_match');
    setForm(true);
  }

  async function deleteCase(caseId: number) {
    if (!window.confirm('Delete this test case? This cannot be undone.')) return;
    try {
      const r = await authFetch(`${API_BASE}/test-cases/${caseId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Could not delete test case');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete case');
    }
  }

  async function deleteProject() {
    if (!window.confirm(`Permanently delete project "${project?.name}" and all associated test cases and evaluation runs?`)) return;
    try {
      const r = await authFetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Could not delete project');
      router.push('/projects');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete project');
    }
  }

  async function clearProjectData() {
    if (!window.confirm(`Clear all test cases, runs, and regression history for "${project?.name}"? Project shell and configuration will be kept.`)) return;
    try {
      const r = await authFetch(`${API_BASE}/projects/${id}/data`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Could not clear project data');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not clear data');
    }
  }

  async function run() {
    setBusy(true);
    setRunMsg(null);
    setErr('');
    try {
      const outputs: Record<string, string> = {};
      for (const c of cases) {
        if (actual.trim()) outputs[String(c.id)] = actual;
      }
      const payload: Record<string, any> = {
        trigger: 'manual',
        outputs: Object.keys(outputs).length ? outputs : undefined,
      };
      if (selectedBaselineId) {
        payload.baseline_run_id = Number(selectedBaselineId);
      }

      const r = await authFetch(`${API_BASE}/projects/${id}/runs`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || 'Evaluation run failed');

      setRunMsg({
        id: data.id,
        gate_passed: Boolean(data.gate_passed),
        text: `Run #${data.id}: ${data.status.toUpperCase()} · ${data.passed}/${data.total} passed · gate ${
          data.gate_passed ? 'PASSED' : 'FAILED'
        }. ${data.gate_reasons?.join(' ') || ''}`,
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="shell py-9 md:py-12">
          <div className="flex items-center justify-between mb-6">
            <Link href="/projects" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300">
              <ArrowLeft size={13} /> Projects
            </Link>
            <div className="flex gap-2">
              <button onClick={clearProjectData} className="button text-xs text-zinc-400 hover:text-white">
                Clear test data
              </button>
              <button onClick={deleteProject} className="button text-xs text-rose-300 hover:border-rose-900">
                <Trash2 size={13} /> Delete project
              </button>
            </div>
          </div>

          {err && (
            <div role="alert" className="mb-5 border border-rose-900 bg-rose-950/20 p-3 text-sm text-rose-200">
              {err}
            </div>
          )}

          {project && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="eyebrow mb-3">Project / {project.id}</div>
                  <h1 className="text-3xl tracking-tight">{project.name}</h1>
                  <p className="mt-2 text-sm text-zinc-500">
                    {project.description || 'Evaluation suite and release criteria.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setProjectName(project.name);
                      setProjectDescription(project.description || '');
                      setProjectForm(!projectForm);
                    }}
                    className="button"
                  >
                    Edit project
                  </button>
                  <button onClick={() => void load()} className="button" aria-label="Refresh">
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {projectForm && (
                <form onSubmit={saveProject} className="panel mt-5 max-w-2xl p-5">
                  <h2 className="mb-4 text-base font-medium">Edit project details</h2>
                  <label className="mb-2 block text-xs text-zinc-400">Name</label>
                  <input
                    className="field mb-4"
                    required
                    maxLength={120}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                  <label className="mb-2 block text-xs text-zinc-400">Description</label>
                  <textarea
                    className="field mb-4 min-h-20"
                    maxLength={4000}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                  />
                  <button className="button button-primary">Save changes</button>
                  <button type="button" className="button ml-2" onClick={() => setProjectForm(false)}>
                    Cancel
                  </button>
                </form>
              )}

              {/* Stats overview */}
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="panel p-4">
                  <div className="text-xs text-zinc-500">Test cases</div>
                  <div className="mt-3 text-2xl font-mono">{cases.length}</div>
                </div>
                <div className="panel p-4">
                  <div className="text-xs text-zinc-500">Gate minimum pass rate</div>
                  <div className="mt-3 text-2xl font-mono">
                    {Math.round((project.config?.gate?.min_pass_rate ?? 1) * 100)}%
                  </div>
                </div>
                <div className="panel p-4">
                  <div className="text-xs text-zinc-500">Execution mode</div>
                  <div className="mt-3 text-base">Deterministic checks</div>
                </div>
              </div>

              {/* Test Cases Header */}
              <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl">Test cases</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Deterministic checks without third-party API dependencies.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setForm(!form);
                    setEditingCase(null);
                    setName('');
                    setInput('');
                    setExpected('');
                  }}
                  className="button button-primary"
                >
                  <Plus size={14} /> Add test case
                </button>
              </div>

              {/* Test Case Form */}
              {form && (
                <form onSubmit={addCase} className="panel mt-4 max-w-2xl p-5">
                  <h3 className="mb-4 text-base font-medium">{editingCase ? 'Edit test case' : 'New test case'}</h3>
                  <label className="mb-2 block text-xs text-zinc-400">Name</label>
                  <input
                    required
                    className="field mb-4"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Delivery Time Check"
                  />
                  <label className="mb-2 block text-xs text-zinc-400">Input / prompt</label>
                  <textarea
                    required
                    className="field mb-4 min-h-20"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="User question or system prompt"
                  />
                  <label className="mb-2 block text-xs text-zinc-400">Expected output</label>
                  <input
                    className="field mb-4"
                    value={expected}
                    onChange={(e) => setExpected(e.target.value)}
                    placeholder="Expected deterministic response"
                  />
                  <label className="mb-2 block text-xs text-zinc-400">Criterion</label>
                  <select
                    className="field mb-5"
                    value={criteria}
                    onChange={(e) => setCriteria(e.target.value)}
                  >
                    <option value="exact_match">Exact match</option>
                    <option value="contains">Contains expected text</option>
                    <option value="not_contains">Must not contain expected text</option>
                  </select>
                  <div className="flex gap-2">
                    <button disabled={busy} className="button button-primary">
                      {busy ? 'Saving…' : editingCase ? 'Update test case' : 'Save test case'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(false);
                        setEditingCase(null);
                      }}
                      className="button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Cases Table */}
              <div className="panel mt-4">
                {cases.length === 0 ? (
                  <div className="p-8 text-sm text-zinc-500">
                    No test cases configured yet. Add a test case to define expected behavior.
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Input</th>
                          <th>Expected</th>
                          <th>Criteria</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases.map((c) => (
                          <tr key={c.id}>
                            <td className="font-medium text-zinc-200">{c.name}</td>
                            <td className="max-w-[220px] truncate text-zinc-400">{c.input_text}</td>
                            <td className="max-w-[180px] truncate text-zinc-400">
                              {c.expected_output || '—'}
                            </td>
                            <td className="text-zinc-400">{c.criteria.map((x) => x.type).join(', ')}</td>
                            <td>
                              <div className="flex gap-3">
                                <button onClick={() => editCase(c)} className="text-xs text-violet hover:underline">
                                  Edit
                                </button>
                                <button
                                  onClick={() => void deleteCase(c.id)}
                                  className="text-xs text-rose-300 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Execution Panel with Baseline Selection */}
              <div className="panel mt-8 p-6">
                <div className="flex items-center gap-2">
                  <Play size={16} className="text-violet" />
                  <h2 className="text-lg font-medium">Run Evaluation</h2>
                </div>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-400">
                  Provide candidate output to test all cases against your release criteria. You can also select a prior
                  passing run as a baseline to detect regressions.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-zinc-300">
                      Baseline Run for Regression Comparison
                    </label>
                    <select
                      className="field"
                      value={selectedBaselineId}
                      onChange={(e) => setSelectedBaselineId(e.target.value)}
                    >
                      <option value="">No baseline comparison (standalone run)</option>
                      {baselines.map((b) => (
                        <option key={b.id} value={b.id}>
                          Run #{b.id} ({b.gate_passed ? 'Gate Passed' : 'Gate Failed'} · {b.passed}/{b.total} passed · {new Date(b.created_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Selecting a baseline classifies newly failing tests as regressions.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-zinc-300">
                      Actual output (candidate application output)
                    </label>
                    <textarea
                      className="field min-h-20"
                      value={actual}
                      onChange={(e) => setActual(e.target.value)}
                      placeholder="Paste the target application's output to evaluate…"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Leaving this blank produces an inconclusive run, not a false pass.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => void run()}
                    disabled={busy || cases.length === 0}
                    className="button button-primary"
                  >
                    <Play size={14} /> {busy ? 'Running evaluation…' : 'Execute evaluation'}
                  </button>
                  {selectedBaselineId && (
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <GitCompareArrows size={13} className="text-violet" /> Comparing against #{selectedBaselineId}
                    </span>
                  )}
                </div>

                {runMsg && (
                  <div
                    role="status"
                    className={`mt-4 border p-4 text-xs ${
                      runMsg.gate_passed
                        ? 'border-emerald-900 bg-emerald-950/20 text-emerald-200'
                        : 'border-rose-900 bg-rose-950/20 text-rose-200'
                    }`}
                  >
                    <span>{runMsg.text}</span>
                    <Link className="ml-3 text-violet font-medium underline inline-flex items-center gap-1" href={`/runs/${runMsg.id}`}>
                      View run details →
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
