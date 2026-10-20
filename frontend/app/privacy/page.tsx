import Link from 'next/link';
import TopNav from '@/components/TopNav';
import { ShieldCheck, Lock, Database, Globe, KeyRound, Server, AlertCircle } from 'lucide-react';

export default function Privacy() {
  return (
    <>
      <TopNav />
      <main className="shell max-w-4xl py-14 md:py-20">
        <div className="eyebrow mb-4 flex items-center gap-2">
          <span className="h-px w-6 bg-violet" />
          Trust &amp; Data Architecture
        </div>
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">Privacy Policy</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>Effective Date: October 19, 2026</span>
          <span>·</span>
          <span>Last Updated: October 20, 2026</span>
        </div>

        <p className="mt-8 max-w-3xl leading-7 text-zinc-300">
          EvalOps is a deterministic evaluation platform for testing artificial intelligence (AI) application outputs,
          detecting regressions across evaluation runs against persisted baselines, and enforcing configurable release quality gates.
          This Privacy Policy accurately reflects the actual data collected, processed, encrypted, stored, and deleted by the
          EvalOps codebase, distinguishing local single-node development environments from self-hosted or managed deployments.
        </p>

        {/* Quick jump navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-y border-line py-4 text-xs">
          <a href="#collected" className="text-zinc-400 hover:text-violet transition-colors">1. Information Collected</a>
          <span className="text-zinc-700">·</span>
          <a href="#purposes" className="text-zinc-400 hover:text-violet transition-colors">2. Purpose of Processing</a>
          <span className="text-zinc-700">·</span>
          <a href="#auth" className="text-zinc-400 hover:text-violet transition-colors">3. Passwords &amp; Sessions</a>
          <span className="text-zinc-700">·</span>
          <a href="#secrets" className="text-zinc-400 hover:text-violet transition-colors">4. Secrets &amp; Credentials</a>
          <span className="text-zinc-700">·</span>
          <a href="#dataflow" className="text-zinc-400 hover:text-violet transition-colors">5. Evaluation Data Flow</a>
          <span className="text-zinc-700">·</span>
          <a href="#isolation" className="text-zinc-400 hover:text-violet transition-colors">6. Access &amp; Workspace Isolation</a>
          <span className="text-zinc-700">·</span>
          <a href="#storage" className="text-zinc-400 hover:text-violet transition-colors">7. Cookies &amp; Storage</a>
          <span className="text-zinc-700">·</span>
          <a href="#deletion" className="text-zinc-400 hover:text-violet transition-colors">8. Retention &amp; Deletion</a>
          <span className="text-zinc-700">·</span>
          <a href="#security" className="text-zinc-400 hover:text-violet transition-colors">9. Security &amp; Limitations</a>
          <span className="text-zinc-700">·</span>
          <a href="#contact" className="text-zinc-400 hover:text-violet transition-colors">10. Contact &amp; Governance</a>
        </div>

        <div className="mt-12 space-y-12">
          {/* 1. Information Collected */}
          <section id="collected" className="scroll-mt-6">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <Database size={18} className="text-violet" /> 1. Information Collected and Stored
            </h2>
            <p className="mt-3 leading-7 text-zinc-400">
              EvalOps collects and stores only the data strictly necessary to provide user authentication, project workspace isolation,
              and deterministic evaluation execution:
            </p>
            <ul className="mt-4 list-disc pl-5 space-y-2 text-sm leading-6 text-zinc-400">
              <li>
                <strong className="text-zinc-200">Account Credentials:</strong> Full name, normalized email address (unique identifier), and a bcrypt-hashed representation of the user password. Plaintext passwords are never stored, logged, or transmitted back to client interfaces.
              </li>
              <li>
                <strong className="text-zinc-200">Session Data:</strong> Cryptographically random 256-bit URL-safe tokens, stored in the database exclusively as SHA-256 hashes alongside creation and expiration timestamps (defaulting to 7 days).
              </li>
              <li>
                <strong className="text-zinc-200">Project Configurations:</strong> Project names, descriptions, release gate criteria (such as minimum pass rates and critical failure blocks), and project metadata in JSON format.
              </li>
              <li>
                <strong className="text-zinc-200">Test Cases:</strong> Test case names, descriptions, input prompts, expected target outputs, deterministic evaluation criteria (exact match, substring inclusion, JSON schema definitions, latency thresholds), and categorizing tags.
              </li>
              <li>
                <strong className="text-zinc-200">Evaluation Runs &amp; Test Results:</strong> Execution timestamps, trigger mechanisms (<code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">manual</code>, <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">cli</code>, or <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">ci</code>), commit/revision hashes, duration, gate pass/fail decisions, actual candidate outputs, assertion results, latency measurements, token counts, and regression diff classifications.
              </li>
              <li>
                <strong className="text-zinc-200">Integration Configuration:</strong> External model provider configurations including target API base URL, model identifiers, timeout parameters, and encrypted API keys.
              </li>
              <li>
                <strong className="text-zinc-200">Audit Events:</strong> Internal event records (<code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">user_registered</code>, <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">user_logged_in</code>, <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">project_created</code>, <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">integration_created</code>, <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">evaluation_run_created</code>) tracking operational changes for security oversight.
              </li>
            </ul>
          </section>

          {/* 2. Purpose */}
          <section id="purposes" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <ShieldCheck size={18} className="text-violet" /> 2. Purpose and Lawful Basis of Processing
            </h2>
            <p className="mt-3 leading-7 text-zinc-400">
              Data submitted to EvalOps is processed exclusively to deliver the functionality requested by the user:
            </p>
            <ul className="mt-4 list-disc pl-5 space-y-1.5 text-sm leading-6 text-zinc-400">
              <li>Authenticating users and isolating individual user workspaces from cross-tenant access.</li>
              <li>Executing deterministic checks against candidate outputs locally without external API dependencies.</li>
              <li>Comparing candidate evaluation runs against designated baseline runs to detect behavioral and performance regressions.</li>
              <li>Calculating automated pass/fail release gate thresholds for continuous integration (CI) workflows.</li>
              <li>Enforcing rate limiting on public authentication endpoints to protect against brute-force attacks.</li>
            </ul>
          </section>

          {/* 3. Authentication & Sessions */}
          <section id="auth" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <Lock size={18} className="text-violet" /> 3. Passwords, Session Management &amp; Rate Limiting
            </h2>
            <div className="mt-3 space-y-4 text-sm leading-6 text-zinc-400">
              <p>
                <strong className="text-zinc-200">Password Hashing:</strong> User passwords are salted with cryptographically random salt and hashed using <strong className="text-zinc-300">bcrypt</strong> prior to database persistence. Plaintext passwords never enter database tables, logs, or backups.
              </p>
              <p>
                <strong className="text-zinc-200">Session Verification:</strong> Sessions are generated using high-entropy random tokens (<code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">secrets.token_urlsafe(32)</code>). The raw token is returned to the client upon login, while only its one-way SHA-256 cryptographic digest is persisted in the <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">user_sessions</code> table. Sessions expire automatically after 7 days and are immediately revoked upon explicit logout.
              </p>
              <p>
                <strong className="text-zinc-200">Rate Limiting:</strong> In-memory sliding-window rate limiters restrict login and registration attempts to a maximum of 15 requests per minute per IP address to safeguard against credential-stuffing attacks.
              </p>
            </div>
          </section>

          {/* 4. Secrets Protection */}
          <section id="secrets" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <KeyRound size={18} className="text-violet" /> 4. Storage and Encryption of Integration Credentials
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              When an optional external model integration is configured, API secret keys are encrypted at rest using AES-128-CBC authenticated encryption with HMAC-SHA256 (via the Python cryptography <strong className="text-zinc-300">Fernet</strong> implementation) derived from the server master secret key:
            </p>
            <ul className="mt-4 list-disc pl-5 space-y-2 text-sm leading-6 text-zinc-400">
              <li>Plaintext API keys are never rendered in the frontend user interface; only masked strings showing the terminal characters (e.g., <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">••••••••cdef</code> or <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">sk-••••••••cdef</code>) are accessible.</li>
              <li>Decryption occurs strictly in-memory during live evaluation execution or explicit connection verification requests.</li>
              <li>Error messages returned by external providers are sanitized so that authorization headers, secret keys, and request payloads are never leaked in error logs or HTTP responses.</li>
            </ul>
          </section>

          {/* 5. Evaluation Data Flow */}
          <section id="dataflow" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <Globe size={18} className="text-violet" /> 5. Evaluation Data Flow &amp; Third-Party Services
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              EvalOps operates under two distinct evaluation models with completely different data flow implications:
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="border border-line bg-[#101016] p-5 rounded">
                <div className="text-xs font-mono font-semibold text-emerald-400">Deterministic Offline Evaluation</div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  Evaluates explicitly provided outputs against local assertions (exact match, contains, JSON schema, latency limits) strictly inside the local host Python process. <strong className="text-zinc-300">No prompts or outputs are transmitted over the network to external AI providers.</strong>
                </p>
              </div>
              <div className="border border-line bg-[#101016] p-5 rounded">
                <div className="text-xs font-mono font-semibold text-violet">Live External Provider Evaluation</div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  Opt-in mode that sends prompt text to the operator-specified or user-specified OpenAI-compatible endpoint. Requires explicit provider selection, configured API credentials, and an active <strong className="text-zinc-300">data disclosure acknowledgement</strong>.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              EvalOps does not incorporate third-party advertising SDKs, behavioral tracking scripts, or analytics telemetry.
            </p>
          </section>

          {/* 6. Workspace Isolation */}
          <section id="isolation" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <Server size={18} className="text-violet" /> 6. Access Control &amp; Workspace Isolation
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              EvalOps enforces multi-tenant database isolation at the API routing layer. Projects, test cases, evaluation runs, and integration credentials belong exclusively to the authenticated user account that created them. Every API endpoint enforces strict foreign-key verification, returning HTTP 401 when unauthenticated and HTTP 403 Forbidden upon any attempt to view, edit, or delete another user's resources, preventing Insecure Direct Object Reference (IDOR) vulnerabilities.
            </p>
          </section>

          {/* 7. Cookies & Local Storage */}
          <section id="storage" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100">7. Cookies, Local Storage &amp; Tracking Technologies</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              EvalOps uses strictly necessary first-party client storage to preserve authenticated sessions:
            </p>
            <ul className="mt-4 list-disc pl-5 space-y-1.5 text-sm leading-6 text-zinc-400">
              <li><strong className="text-zinc-200">localStorage:</strong> Stores <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">evalops_auth_token</code> (the bearer authentication token) and <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">evalops_auth_user</code> (cached user profile data: email, name, user ID). Cleared upon logout.</li>
              <li><strong className="text-zinc-200">Session Cookie:</strong> If enabled by deployment configuration, an optional <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">evalops_session</code> HttpOnly cookie with <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">SameSite=Lax</code> is issued for authenticated session verification.</li>
              <li><strong className="text-zinc-200">No Analytics or Ad Trackers:</strong> EvalOps does not load Google Analytics, Meta Pixels, or external tracking beacons.</li>
            </ul>
          </section>

          {/* 8. Data Retention & Deletion */}
          <section id="deletion" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100">8. Data Retention, Account Deletion &amp; Purging</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Users have direct self-service control over stored information with cascading permanent deletion:
            </p>
            <ul className="mt-4 list-disc pl-5 space-y-2 text-sm leading-6 text-zinc-400">
              <li><strong className="text-zinc-300">Account Deletion:</strong> Users may permanently delete their account in Workspace Settings (<code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">DELETE /api/v1/auth/me</code>). This triggers an immediate cascade that deletes all associated projects, test cases, evaluation runs, test results, credentials, and user audit events.</li>
              <li><strong className="text-zinc-300">Project Deletion:</strong> Deleting a project permanently deletes all test cases, evaluation runs, and results associated with that project.</li>
              <li><strong className="text-zinc-300">Project Data Reset:</strong> Users can purge historical runs, test results, and test cases while preserving the project shell and configuration.</li>
              <li><strong className="text-zinc-300">Run Deletion:</strong> Individual evaluation runs and their recorded test results can be deleted individually at any time.</li>
              <li><strong className="text-zinc-300">Automated Retention:</strong> Deployments may optionally enforce a global data retention limit via the <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">DATA_RETENTION_DAYS</code> configuration setting.</li>
            </ul>
          </section>

          {/* 9. Security & Honest Limitations */}
          <section id="security" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100">9. Security Safeguards, Incident Handling &amp; Honest Limitations</h2>
            <div className="mt-3 space-y-4 text-sm leading-6 text-zinc-400">
              <p>
                <strong className="text-zinc-200">Technical Safeguards:</strong> Safeguards include bcrypt password hashing, AES credential encryption at rest, SHA-256 session token verification, parameterized SQLAlchemy queries to prevent SQL injection, request body size limits (5MB maximum), sliding-window rate limiting on authentication routes, and defensive HTTP headers (<code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">X-Content-Type-Options: nosniff</code>, <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">X-Frame-Options: DENY</code>, and <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">Referrer-Policy</code>).
              </p>
              <div className="border border-amber-900/60 bg-amber-950/10 p-4 rounded text-xs leading-5 text-amber-200/90 flex gap-3">
                <AlertCircle size={18} className="shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong>Honest Security Limitations:</strong> No software system is impenetrable. In self-hosted or local deployments, overall security is dependent upon the operator’s deployment infrastructure: generating a strong, random <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">SECRET_KEY</code>, enforcing HTTPS/TLS across all public endpoints, restricting database network access, and keeping underlying operating systems and dependencies updated.
                </div>
              </div>
              <p>
                <strong className="text-zinc-200">Incident Handling:</strong> If a security compromise or unauthorized disclosure of credentials is detected, deployment operators should immediately rotate the master <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">SECRET_KEY</code>, revoke active sessions in the database, re-encrypt integration credentials, and notify affected workspace users in accordance with applicable regional notification regulations.
              </p>
            </div>
          </section>

          {/* 10. Contact & Governance */}
          <section id="contact" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100">10. User Rights, Privacy Contact &amp; Legal Notice</h2>
            <div className="mt-3 space-y-4 text-sm leading-6 text-zinc-400">
              <p>
                Users have the right to access, inspect, export, correct, and delete their evaluation records and personal account data directly through the self-service web interface and REST API.
              </p>
              <div className="border border-line bg-[#101016] p-4 rounded text-xs leading-6">
                <div className="font-semibold text-zinc-200 mb-1">Notice for Deployment Operators:</div>
                EvalOps is distributed as a self-hostable software project. The deploying individual or organization must configure the{' '}
                <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">PRIVACY_CONTACT</code> environment variable with their official privacy or administrative contact email before offering workspace access to users.
              </div>
              <p className="text-xs text-zinc-500">
                <strong className="text-zinc-400">Legal Disclaimer:</strong> This Privacy Policy describes the actual technical architecture and data processing operations of the EvalOps software. It does not constitute formal legal counsel and does not automatically certify compliance with regional privacy frameworks (such as GDPR, CCPA, or HIPAA). Operators are advised to have qualified legal counsel review their deployment terms and regional requirements prior to production release.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-14 border-t border-line pt-8 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex gap-4 text-zinc-400">
            <Link href="/terms" className="text-violet hover:underline">Terms of Service</Link>
            <span>·</span>
            <Link href="/docs" className="text-violet hover:underline">Documentation</Link>
            <span>·</span>
            <Link href="/settings" className="text-violet hover:underline">Workspace Settings</Link>
          </div>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Return to home page
          </Link>
        </div>
      </main>

      {/* Standard Consistent Footer */}
      <footer className="border-t border-line">
        <div className="shell flex flex-col justify-between gap-6 py-10 text-xs text-zinc-500 sm:flex-row sm:items-center md:py-12">
          <span>© 2026 EvalOps. All rights reserved.</span>
          <div className="flex flex-wrap gap-6 text-zinc-400">
            <Link href="/privacy" className="text-violet hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-zinc-200 transition-colors">
              Terms of Service
            </Link>
            <Link href="/docs" className="hover:text-zinc-200 transition-colors">
              Documentation
            </Link>
            <a href="mailto:privacy@evalops.local" className="hover:text-zinc-200 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
