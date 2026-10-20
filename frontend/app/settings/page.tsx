'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import {
  User as UserIcon,
  KeyRound,
  ShieldCheck,
  Database,
  Trash2,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { API_BASE, authFetch, getUser, logout, User } from '@/lib/auth';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile update state
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Deletion state
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await authFetch(`${API_BASE}/auth/me`);
        if (res.ok) {
          const u = await res.json();
          setUser(u);
          setFullName(u.full_name || '');
        }
      } catch {
        setUser(getUser());
      } finally {
        setLoading(false);
      }
    }
    void loadUser();
  }, []);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    const payload: { full_name?: string; current_password?: string; new_password?: string } = {
      full_name: fullName,
    };

    if (newPassword) {
      if (!currentPassword) {
        setProfileMsg({ type: 'error', text: 'Current password is required to set a new password.' });
        setSavingProfile(false);
        return;
      }
      if (newPassword.length < 8) {
        setProfileMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
        setSavingProfile(false);
        return;
      }
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    }

    try {
      const res = await authFetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update profile');

      setUser(data);
      setCurrentPassword('');
      setNewPassword('');
      setProfileMsg({ type: 'success', text: 'Profile preferences and security settings saved.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE MY ACCOUNT') {
      setDeleteError('Please type DELETE MY ACCOUNT exactly to confirm account deletion.');
      return;
    }
    setDeleteError('');
    try {
      const res = await authFetch(`${API_BASE}/auth/me`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Account deletion request failed');
      await logout();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Deletion failed');
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="shell py-9 md:py-12">
          <div className="eyebrow mb-3">Workspace / Settings</div>
          <h1 className="text-3xl tracking-tight">Settings & Security</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Account preferences, security controls, and data retention policies.
          </p>

          <div className="mt-8 max-w-3xl space-y-6">
            {/* User Profile & Security */}
            <section className="panel p-6">
              <div className="flex items-center gap-3">
                <UserIcon className="text-violet" size={18} />
                <div>
                  <h2 className="font-medium text-base">Account & Security</h2>
                  <p className="text-xs text-zinc-500">Update your account name and authentication credentials.</p>
                </div>
              </div>

              {profileMsg && (
                <div
                  className={`mt-4 border p-3 text-xs ${
                    profileMsg.type === 'success'
                      ? 'border-emerald-900 bg-emerald-950/20 text-emerald-200'
                      : 'border-rose-900 bg-rose-950/20 text-rose-200'
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-xs text-zinc-400">Email address</label>
                  <input
                    disabled
                    className="field bg-zinc-900 text-zinc-400 cursor-not-allowed"
                    value={user?.email || 'Loading…'}
                  />
                  <p className="mt-1 text-[11px] text-zinc-600">Email address cannot be changed directly.</p>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-zinc-400">Full name</label>
                  <input
                    className="field"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="border-t border-line pt-4">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-400">Change Password</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Current password</label>
                      <input
                        type="password"
                        className="field"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">New password (min. 8 chars)</label>
                      <input
                        type="password"
                        className="field"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="button button-primary mt-4"
                >
                  {savingProfile ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </section>

            {/* Evaluation Defaults */}
            <section className="panel p-6">
              <div className="flex items-center gap-3">
                <Sliders className="text-violet" size={18} />
                <div>
                  <h2 className="font-medium text-base">Release Gate Defaults</h2>
                  <p className="text-xs text-zinc-500">Deterministic quality threshold rules applied to evaluation suites.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="border border-line p-4">
                  <div className="text-xs text-zinc-500">Default minimum pass rate</div>
                  <div className="mt-2 text-2xl font-mono">100%</div>
                  <p className="mt-2 text-[11px] text-zinc-500">Configurable per project in the project editor.</p>
                </div>
                <div className="border border-line p-4">
                  <div className="text-xs text-zinc-500">Zero Critical Failures</div>
                  <div className="mt-2 text-2xl font-mono text-emerald-400">Enforced</div>
                  <p className="mt-2 text-[11px] text-zinc-500">Blocks release gate if any exact-match check fails.</p>
                </div>
              </div>
            </section>

            {/* External Integrations Link */}
            <section className="panel p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <KeyRound className="text-violet shrink-0" size={18} />
                  <div>
                    <h2 className="font-medium text-base">External Model Credentials</h2>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      Manage encrypted credentials for opt-in model provider endpoints. Raw keys are never stored in plain text.
                    </p>
                  </div>
                </div>
                <Link href="/integrations" className="button shrink-0">
                  Manage Integrations <ArrowUpRight size={13} />
                </Link>
              </div>
            </section>

            {/* Privacy & Compliance */}
            <section className="panel p-6">
              <div className="flex gap-3">
                <ShieldCheck className="text-violet shrink-0" size={18} />
                <div>
                  <h2 className="font-medium text-base">Privacy & Retention Policy</h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    EvalOps stores deterministic test cases, evaluation runs, and candidate outputs in your configured database.
                    Data is never sold or shared with third parties.
                  </p>
                  <div className="mt-4 flex gap-4 text-xs">
                    <Link className="text-violet hover:underline flex items-center gap-1" href="/privacy">
                      Read Privacy Policy <ArrowUpRight size={12} />
                    </Link>
                    <Link className="text-violet hover:underline flex items-center gap-1" href="/terms">
                      Terms of Service <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Destructive Zone: Account Deletion */}
            <section className="border border-rose-950 bg-rose-950/10 p-6 rounded-lg">
              <div className="flex items-start gap-3">
                <Trash2 className="text-rose-400 shrink-0 mt-0.5" size={18} />
                <div className="w-full">
                  <h2 className="font-medium text-base text-rose-200">Delete Account & Workspace</h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    Permanently delete your account, projects, test cases, evaluation runs, and encrypted credentials.
                    This action cannot be undone.
                  </p>

                  {!deletingAccount ? (
                    <button
                      onClick={() => setDeletingAccount(true)}
                      className="button mt-4 border-rose-900 text-rose-300 hover:bg-rose-950/30"
                    >
                      Delete Account…
                    </button>
                  ) : (
                    <div className="mt-4 border border-rose-900 bg-black/40 p-4">
                      {deleteError && (
                        <div role="alert" className="mb-3 text-xs text-rose-300 font-medium">
                          {deleteError}
                        </div>
                      )}
                      <label className="block text-xs text-zinc-400 mb-2">
                        Type <strong className="text-white mono">DELETE MY ACCOUNT</strong> to confirm:
                      </label>
                      <input
                        className="field mb-3"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="DELETE MY ACCOUNT"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          className="button bg-rose-600 text-white border-rose-600 font-medium"
                        >
                          Confirm Permanent Deletion
                        </button>
                        <button
                          onClick={() => {
                            setDeletingAccount(false);
                            setDeleteConfirm('');
                            setDeleteError('');
                          }}
                          className="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
