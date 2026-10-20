'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import {
  Plug,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Send,
  Plus,
} from 'lucide-react';
import { API_BASE, authFetch } from '@/lib/auth';

type Integration = {
  id: number;
  provider: string;
  api_base: string;
  masked_key: string;
  model_name: string;
  is_enabled: boolean;
  data_disclosure_acknowledged: boolean;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState<{ id: number; success: boolean; message: string; latency_ms?: number } | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);

  // Form states
  const [showAdd, setShowAdd] = useState(false);
  const [apiBase, setApiBase] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gpt-4o-mini');
  const [timeoutSeconds, setTimeoutSeconds] = useState(20);
  const [disclosureAck, setDisclosureAck] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_BASE}/integrations`);
      if (!res.ok) throw new Error(`Could not load integrations (HTTP ${res.status})`);
      const data = await res.json();
      setIntegrations(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!disclosureAck) {
      setError('You must acknowledge the data disclosure agreement to configure an external model endpoint.');
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/integrations`, {
        method: 'POST',
        body: JSON.stringify({
          provider: 'openai_compatible',
          api_base: apiBase,
          api_key: apiKey,
          model_name: modelName,
          timeout_seconds: Number(timeoutSeconds),
          data_disclosure_acknowledged: disclosureAck,
          is_enabled: isEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to save integration');

      setSuccess('Integration credentials successfully encrypted and saved on the server.');
      setApiKey('');
      setShowAdd(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving integration');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(integId: number) {
    setTestingId(integId);
    setTestResult(null);
    setError('');
    try {
      const res = await authFetch(`${API_BASE}/integrations/${integId}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      setTestResult({
        id: integId,
        success: data.success,
        message: data.message,
        latency_ms: data.latency_ms,
      });
    } catch (e) {
      setTestResult({
        id: integId,
        success: false,
        message: e instanceof Error ? e.message : 'Test request failed',
      });
    } finally {
      setTestingId(null);
    }
  }

  async function handleRevoke(integId: number) {
    if (!window.confirm('Are you sure you want to revoke and delete these integration credentials? This action is permanent.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await authFetch(`${API_BASE}/integrations/${integId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Could not revoke integration');
      setSuccess('Integration credentials revoked and deleted from server storage.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke credentials');
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="shell py-9 md:py-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow mb-3">Workspace / Integrations</div>
              <h1 className="text-3xl tracking-tight">External Integrations</h1>
              <p className="mt-2 text-sm text-zinc-500">
                Manage credentials for opt-in external model evaluation endpoints.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void load()} className="button" aria-label="Refresh integrations">
                <RefreshCw size={14} /> Refresh
              </button>
              {integrations.length === 0 && (
                <button onClick={() => setShowAdd(!showAdd)} className="button button-primary">
                  <Plus size={14} /> Configure provider
                </button>
              )}
            </div>
          </div>

          {error && (
            <div role="alert" className="mt-6 border border-rose-900 bg-rose-950/20 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="mt-6 border border-emerald-900 bg-emerald-950/20 p-4 text-sm text-emerald-200">
              {success}
            </div>
          )}

          {/* Core Architectural Principle Banner */}
          <div className="mt-6 border border-line bg-zinc-950/60 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 text-violet shrink-0" size={18} />
              <div>
                <h2 className="text-sm font-medium text-zinc-200">Deterministic Evaluation by Default</h2>
                <p className="mt-1.5 text-xs leading-5 text-zinc-400">
                  EvalOps does not require an external model API to test application outputs. Evaluations compare
                  explicitly supplied candidate outputs against defined criteria (exact match, required fields, JSON schema,
                  latency thresholds). External provider integrations are strictly opt-in and send prompt inputs to your
                  configured endpoint only when explicitly initiated.
                </p>
              </div>
            </div>
          </div>

          {/* Add / Edit Form */}
          {showAdd && (
            <form onSubmit={handleSave} className="panel mt-6 max-w-2xl p-6">
              <h2 className="text-lg font-medium">Configure OpenAI-Compatible Endpoint</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Compatible with OpenAI, Ollama, vLLM, LocalAI, or any provider implementing the standard /chat/completions schema.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-300">
                    Endpoint Base URL
                  </label>
                  <input
                    required
                    type="url"
                    className="field"
                    value={apiBase}
                    onChange={(e) => setApiBase(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Must start with http:// or https://. For local Ollama use http://localhost:11434/v1.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-300">
                    Target Model Name
                  </label>
                  <input
                    required
                    type="text"
                    className="field"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="gpt-4o-mini or llama3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-300">
                    API Key / Secret Token
                  </label>
                  <input
                    required
                    type="password"
                    className="field font-mono text-sm"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-••••••••••••••••"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Encrypted using AES at rest on the server. Your raw secret key is never sent back to the browser.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-300">
                    Request Timeout (Seconds)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    className="field max-w-xs"
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 text-xs leading-5 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={disclosureAck}
                      onChange={(e) => setDisclosureAck(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      <strong className="text-zinc-100">Data Disclosure Acknowledgement:</strong> I understand that
                      when evaluation runs opt into this external target, test prompts will be transmitted over the network
                      to this endpoint. I confirm that I am authorized to process this data under our privacy policy.
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="submit" disabled={saving} className="button button-primary">
                  {saving ? 'Encrypting & Saving…' : 'Save Integration'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="button">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Configured Integrations List */}
          <div className="panel mt-6">
            <div className="border-b border-line px-5 py-4 text-sm font-medium">
              Configured Providers
            </div>

            {loading ? (
              <div className="p-8 text-sm text-zinc-500">Loading integration credentials…</div>
            ) : integrations.length === 0 ? (
              <div className="p-10 text-center">
                <Plug size={24} className="mx-auto text-zinc-600" />
                <h3 className="mt-3 text-base">No external providers configured</h3>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-zinc-500">
                  EvalOps is currently operating in 100% deterministic local evaluation mode. Unconfigured providers are
                  accurately displayed as unconfigured.
                </p>
                <button onClick={() => setShowAdd(true)} className="button button-primary mt-5">
                  <Plus size={14} /> Configure provider
                </button>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {integrations.map((integ) => (
                  <div key={integ.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-zinc-200">
                            {integ.provider === 'openai_compatible' ? 'OpenAI-Compatible Endpoint' : integ.provider}
                          </h3>
                          {testResult && testResult.id === integ.id ? (
                            testResult.success ? (
                              <span className="status status-pass">
                                VERIFIED ({testResult.latency_ms !== undefined ? `${testResult.latency_ms.toFixed(0)}ms` : 'online'})
                              </span>
                            ) : (
                              <span className="status status-fail">CONNECTION FAILED</span>
                            )
                          ) : integ.is_enabled ? (
                            <span className="status status-neutral">CREDENTIALS SAVED · UNTESTED</span>
                          ) : (
                            <span className="status status-neutral">DISABLED</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          Base: <span className="mono text-zinc-300">{integ.api_base}</span> · Model:{' '}
                          <span className="mono text-zinc-300">{integ.model_name || 'default'}</span>
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Note: Stored credentials do not guarantee connectivity. Use <strong>Test Connection</strong> to verify live endpoint availability.
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                          <KeyRound size={13} className="text-zinc-600" />
                          <span>Secret key:</span>
                          <span className="mono rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-300">
                            {integ.masked_key}
                          </span>
                          <span className="text-[11px] text-zinc-600">(Stored encrypted with AES)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTest(integ.id)}
                          disabled={testingId === integ.id}
                          className="button text-xs"
                        >
                          <Send size={13} />
                          {testingId === integ.id ? 'Testing…' : 'Test Connection'}
                        </button>
                        <button
                          onClick={() => handleRevoke(integ.id)}
                          className="button text-xs text-rose-300 hover:border-rose-800"
                        >
                          <Trash2 size={13} /> Revoke
                        </button>
                      </div>
                    </div>

                    {/* Test feedback */}
                    {testResult && testResult.id === integ.id && (
                      <div
                        className={`mt-4 flex items-center gap-2 border p-3 text-xs ${
                          testResult.success
                            ? 'border-emerald-900 bg-emerald-950/20 text-emerald-200'
                            : 'border-rose-900 bg-rose-950/20 text-rose-200'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={15} className="text-rose-400 shrink-0" />
                        )}
                        <span>{testResult.message}</span>
                        {testResult.latency_ms && (
                          <span className="mono ml-auto text-zinc-400">
                            {testResult.latency_ms.toFixed(1)} ms
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
