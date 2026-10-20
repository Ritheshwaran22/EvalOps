import Link from 'next/link';
import TopNav from '@/components/TopNav';
import {
  ArrowRight,
  ArrowUpRight,
  Terminal,
  Server,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  FileCode2,
  Cpu,
  Layers,
} from 'lucide-react';

export default function Docs() {
  return (
    <>
      <TopNav />
      <main className="shell max-w-4xl py-14 md:py-20">
        <div className="eyebrow mb-4 flex items-center gap-2">
          <span className="h-px w-6 bg-violet" />
          Documentation &amp; Guides
        </div>
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          Start evaluating with verifiable evidence.
        </h1>
        <p className="mt-5 max-w-2xl leading-7 text-zinc-400">
          EvalOps executes deterministic assertions against LLM application outputs, detects regressions
          against persisted baselines, and enforces strict quality gates in CI/CD pipelines.
        </p>

        {/* Quick jump navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-y border-line py-4 text-xs">
          <a href="#quickstart" className="text-zinc-400 hover:text-violet transition-colors">
            1. Quickstart
          </a>
          <span className="text-zinc-700">·</span>
          <a href="#api" className="text-zinc-400 hover:text-violet transition-colors">
            2. Backend API
          </a>
          <span className="text-zinc-700">·</span>
          <a href="#cli" className="text-zinc-400 hover:text-violet transition-colors">
            3. CLI &amp; Evaluation
          </a>
          <span className="text-zinc-700">·</span>
          <a href="#assertions" className="text-zinc-400 hover:text-violet transition-colors">
            4. Assertions &amp; Gates
          </a>
          <span className="text-zinc-700">·</span>
          <a href="#ci" className="text-zinc-400 hover:text-violet transition-colors">
            5. GitHub Actions CI
          </a>
          <span className="text-zinc-700">·</span>
          <a href="#endpoints" className="text-zinc-400 hover:text-violet transition-colors">
            6. REST Endpoints
          </a>
        </div>

        <div className="mt-12 space-y-14">
          {/* Section 1: Quickstart */}
          <section id="quickstart" className="scroll-mt-6">
            <div className="flex items-center gap-2 text-sm font-medium text-violet">
              <Terminal size={16} /> 1. Quickstart Evaluation Loop
            </div>
            <h2 className="mt-2 text-2xl font-medium tracking-tight">Run your first evaluation in seconds</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Deterministic checks execute locally without requiring external model credentials.
              Validate your configuration file and run the test suite against explicit output fixtures:
            </p>
            <pre className="mt-4 overflow-x-auto border border-line bg-[#101016] p-4 text-xs leading-6 mono text-zinc-300 rounded">
{'# Validate your evaluation suite configuration\nevalops validate-config --project-config examples/evalops.yaml\n\n# Run evaluation and generate a GitHub Action markdown summary\nevalops evaluate --project-config examples/evalops.yaml --github-summary'}
            </pre>
            <p className="mt-3 text-xs text-zinc-500">
              The example configuration file contains explicit test fixtures for CI demonstration. Replace them with your application’s live outputs or configure an integration provider.
            </p>
          </section>

          {/* Section 2: Backend API */}
          <section id="api" className="scroll-mt-6 border-t border-line pt-10">
            <div className="flex items-center gap-2 text-sm font-medium text-violet">
              <Server size={16} /> 2. Backend API &amp; Database Setup
            </div>
            <h2 className="mt-2 text-2xl font-medium tracking-tight">Starting the backend services</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              The backend is built with FastAPI, SQLAlchemy ORM, and PostgreSQL (or local SQLite for single-node development).
            </p>
            <pre className="mt-4 overflow-x-auto border border-line bg-[#101016] p-4 text-xs leading-6 mono text-zinc-300 rounded">
{'cd backend\npython -m venv .venv\n# On Linux/macOS: source .venv/bin/activate\n# On Windows: .venv\\Scripts\\activate\n\npip install -e ".[test]"\nalembic upgrade head\nuvicorn evalops.api:app --reload --port 8000'}
            </pre>
            <p className="mt-3 text-xs text-zinc-500">
              By default, the server runs on <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">http://localhost:8000</code>. Interactive Swagger UI is available at <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">http://localhost:8000/docs</code>.
            </p>
          </section>

          {/* Section 3: CLI & Evaluation */}
          <section id="cli" className="scroll-mt-6 border-t border-line pt-10">
            <div className="flex items-center gap-2 text-sm font-medium text-violet">
              <Cpu size={16} /> 3. CLI Options &amp; Exit Codes
            </div>
            <h2 className="mt-2 text-2xl font-medium tracking-tight">Deterministic evaluation execution</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              The CLI is designed to act as a strict release gate in automation pipelines:
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="border border-line bg-[#101016] p-4 rounded">
                <div className="font-mono text-xs text-emerald-400 font-semibold">Exit Code 0 · PASS</div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  All critical assertions passed and total pass-rate satisfied the project threshold.
                </p>
              </div>
              <div className="border border-rose-900/60 bg-rose-950/10 p-4 rounded">
                <div className="font-mono text-xs text-rose-300 font-semibold">Exit Code 1 · FAIL</div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  A critical assertion failed or pass-rate dropped below the release gate threshold.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Assertions & Gates */}
          <section id="assertions" className="scroll-mt-6 border-t border-line pt-10">
            <div className="flex items-center gap-2 text-sm font-medium text-violet">
              <ShieldCheck size={16} /> 4. Assertions &amp; Deterministic Checks
            </div>
            <h2 className="mt-2 text-2xl font-medium tracking-tight">Evaluation Criteria</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              EvalOps validates model responses using exact string matches, regex patterns, JSON schema verification, and latency caps:
            </p>
            <ul className="mt-4 list-disc pl-5 space-y-2 text-sm leading-6 text-zinc-400">
              <li><strong className="text-zinc-200">exact_match:</strong> Verifies that output strictly matches expected string.</li>
              <li><strong className="text-zinc-200">contains:</strong> Verifies that required substrings or keywords exist in the response.</li>
              <li><strong className="text-zinc-200">json_schema:</strong> Parses output as valid JSON and validates against provided JSON Schema draft-07.</li>
              <li><strong className="text-zinc-200">latency_ms:</strong> Caps runtime latency (applies when live endpoint generation is active).</li>
            </ul>
          </section>

          {/* Section 5: GitHub Actions CI */}
          <section id="ci" className="scroll-mt-6 border-t border-line pt-10">
            <div className="flex items-center gap-2 text-sm font-medium text-violet">
              <GitBranch size={16} /> 5. GitHub Actions Workflow
            </div>
            <h2 className="mt-2 text-2xl font-medium tracking-tight">Blocking regressions before merge</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Add the evaluation step to <code className="mono bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">.github/workflows/evalops.yml</code> to run on every pull request:
            </p>
            <pre className="mt-4 overflow-x-auto border border-line bg-[#101016] p-4 text-xs leading-6 mono text-zinc-300 rounded">
{'name: LLM Regression Gate\non: [pull_request]\njobs:\n  evaluate:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-python@v5\n        with:\n          python-version: "3.12"\n      - name: Install dependencies\n        run: pip install -e "backend[test]"\n      - name: Run EvalOps Quality Gate\n        run: evalops evaluate --project-config examples/evalops.yaml --github-summary'}
            </pre>
          </section>

          {/* Section 6: REST Endpoints */}
          <section id="endpoints" className="scroll-mt-6 border-t border-line pt-10">
            <div className="flex items-center gap-2 text-sm font-medium text-violet">
              <Layers size={16} /> 6. REST API Endpoints
            </div>
            <h2 className="mt-2 text-2xl font-medium tracking-tight">Core Workspace Endpoints</h2>
            <div className="mt-4 overflow-x-auto border border-line rounded">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-[#101016]">
                    <th className="p-3 text-zinc-400">Method</th>
                    <th className="p-3 text-zinc-400">Endpoint</th>
                    <th className="p-3 text-zinc-400">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="p-3 font-mono text-emerald-400 font-medium">GET/POST</td>
                    <td className="p-3 font-mono text-zinc-300">/api/v1/projects</td>
                    <td className="p-3 text-zinc-400">List or create evaluation projects and gate thresholds</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-emerald-400 font-medium">GET/POST</td>
                    <td className="p-3 font-mono text-zinc-300">/api/v1/test-cases</td>
                    <td className="p-3 text-zinc-400">Manage test prompts, expected outputs, and criteria</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-emerald-400 font-medium">GET/POST</td>
                    <td className="p-3 font-mono text-zinc-300">/api/v1/runs</td>
                    <td className="p-3 text-zinc-400">Trigger evaluation runs and inspect gate pass/fail decisions</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-emerald-400 font-medium">GET</td>
                    <td className="p-3 font-mono text-zinc-300">/api/v1/regressions</td>
                    <td className="p-3 text-zinc-400">Diff run results against baseline run to flag regressions</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Action Link to Workspace */}
        <div className="mt-14 flex items-center justify-between border-t border-line pt-8">
          <Link href="/projects" className="button button-primary">
            Open workspace <ArrowRight size={15} />
          </Link>
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Return to home page
          </Link>
        </div>
      </main>

      {/* Standard Footer */}
      <footer className="border-t border-line">
        <div className="shell flex flex-col justify-between gap-6 py-10 text-xs text-zinc-500 sm:flex-row sm:items-center md:py-12">
          <span>© 2026 EvalOps. All rights reserved.</span>
          <div className="flex flex-wrap gap-6 text-zinc-400">
            <Link href="/privacy" className="hover:text-zinc-200 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-zinc-200 transition-colors">
              Terms of Service
            </Link>
            <Link href="/docs" className="text-violet hover:underline">
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
