import Link from 'next/link';
import TopNav from '@/components/TopNav';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  GitBranch,
  ShieldCheck,
  ScanSearch,
  Info,
} from 'lucide-react';

export default function Home() {
  return (
    <>
      <TopNav />
      <main>
        {/* Hero Section */}
        <section className="shell grid min-h-[620px] items-center gap-14 py-20 md:grid-cols-[1.05fr_.95fr] md:py-28">
          <div>
            <div className="eyebrow mb-7 flex items-center gap-3">
              <span className="h-px w-7 bg-violet" />
              Continuous LLM evaluation
            </div>
            <h1 className="max-w-[720px] text-6xl font-medium leading-[.98] tracking-[-.065em] sm:text-7xl lg:text-[88px]">
              Before it ships,
              <br />
              <span className="text-violet">put it to the test.</span>
            </h1>
            <p className="mt-7 max-w-[520px] text-base leading-7 text-zinc-400">
              EvalOps evaluates AI application outputs against deterministic assertions and release gates rather
              than generating chatbot conversations itself. Test model behavior, catch regressions across runs,
              and make release decisions based on verifiable evidence.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/projects" className="button button-primary">
                Explore EvalOps <ArrowRight size={15} />
              </Link>
              <a href="#platform" className="button">
                How it works <ArrowDownRight size={15} />
              </a>
            </div>

            <div className="mt-12 space-y-2 text-xs text-zinc-500">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={15} className="text-violet shrink-0" />
                <span>Deterministic checks run locally without an external model API.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Info size={15} className="text-violet shrink-0" />
                <span>
                  Explicit-output mode tests manually supplied text; automatic live testing requires a verified target integration.
                </span>
              </div>
            </div>
          </div>

          {/* Illustrative Example Card */}
          <div className="relative">
            <div className="absolute -left-5 top-8 h-[82%] w-px bg-gradient-to-b from-transparent via-violet/60 to-transparent" />
            <div className="panel p-5 sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <span className="eyebrow">Example: Regression Detection</span>
                <span className="text-[10px] text-zinc-500 border border-zinc-800 rounded px-1.5 py-0.5">
                  ILLUSTRATIVE ONLY
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-line p-4">
                  <div className="mb-5 text-xs text-zinc-500">Baseline · v1</div>
                  <p className="mono text-sm leading-6 text-zinc-300">{'{"city": "Paris"}'}</p>
                  <div className="mt-6 flex items-center gap-2 text-xs text-emerald-300">
                    <Check size={14} /> Schema valid
                  </div>
                </div>
                <div className="border border-rose-900/80 bg-rose-950/10 p-4">
                  <div className="mb-5 text-xs text-zinc-500">Candidate · v2</div>
                  <p className="mono text-sm leading-6 text-zinc-300">{'{"city": "Lyon"}'}</p>
                  <div className="mt-6 flex items-center gap-2 text-xs text-rose-300">
                    <ScanSearch size={14} /> Assertion failed
                  </div>
                </div>
              </div>
              <div className="mt-4 border border-line p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">Release gate</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Exact-match criterion no longer holds.
                    </div>
                  </div>
                  <span className="status status-fail">BLOCKED</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-between text-[10px] uppercase tracking-[.15em] text-zinc-600">
              <span>Change detection</span>
              <span>Evidence before release</span>
            </div>
          </div>
        </section>

        {/* 4-Step Practical Evaluation Loop */}
        <section id="platform" className="border-y border-line py-20 md:py-28 scroll-mt-6">
          <div className="shell">
            <div className="eyebrow mb-5 flex items-center gap-3">
              <span className="h-px w-7 bg-violet" />
              A practical evaluation loop
            </div>
            <h2 className="section-title max-w-2xl">From a prompt change to a release decision.</h2>
            <div className="mt-12 grid gap-0 md:grid-cols-4">
              {[
                {
                  n: '01',
                  title: 'Define',
                  body: 'Create projects, test cases, assertions, and configurable pass-rate release thresholds.',
                },
                {
                  n: '02',
                  title: 'Execute',
                  body: 'Evaluate manually supplied explicit outputs, or automatically query your configured, verified target integration.',
                },
                {
                  n: '03',
                  title: 'Compare',
                  body: 'Compare candidate results against a persisted baseline run to distinguish true regressions from pre-existing failures.',
                },
                {
                  n: '04',
                  title: 'Gate',
                  body: 'Enforce quality gates and exit non-zero on failure to halt pull request merges in CI pipelines.',
                },
              ].map((x) => (
                <div
                  key={x.n}
                  className="border-t border-line py-6 pr-6 md:border-r md:px-5 md:first:pl-0"
                >
                  <div className="mono text-xs text-violet">{x.n}</div>
                  <h3 className="mt-7 text-xl">{x.title}</h3>
                  <p className="mt-3 max-w-[240px] text-sm leading-6 text-zinc-500">{x.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Regression Reports & CI Gate */}
        <section className="shell grid gap-12 py-20 md:grid-cols-2 md:py-24">
          <div>
            <div className="eyebrow mb-5">Regression reports</div>
            <h2 className="section-title">A failure should explain itself.</h2>
            <p className="mt-5 max-w-lg leading-7 text-zinc-400">
              Inspect the failed assertion, expected versus actual output, execution latency (displayed only when measured live), baseline comparisons, and gate criteria. Runs without a baseline remain inconclusive.
            </p>
            <Link
              href="/runs"
              className="mt-6 inline-flex items-center gap-2 text-sm text-violet hover:underline"
            >
              Explore evaluation runs <ArrowRight size={14} />
            </Link>
          </div>
          <div className="panel p-6">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <GitBranch size={17} className="text-violet" />
              <div>
                <div className="text-sm font-medium">GitHub Actions</div>
                <div className="mt-1 text-xs text-zinc-500">Pull request evaluation workflow</div>
              </div>
            </div>
            {[
              'Install backend and test dependencies',
              'Validate evaluation configuration',
              'Run deterministic evaluation suite',
              'Enforce pass-rate gate; exit non-zero on failure to block release',
            ].map((x, i) => (
              <div
                key={x}
                className="flex items-start gap-3 border-b border-line py-4 last:border-0"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-[10px] text-violet">
                  {i + 1}
                </span>
                <span className="text-sm text-zinc-300">{x}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-line">
          <div className="shell flex flex-col items-start justify-between gap-8 py-20 md:flex-row md:items-center md:py-28">
            <div className="max-w-xl">
              <div className="eyebrow mb-4">Start with the evidence</div>
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">
                Run your first evaluation.
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Create a project and define the deterministic checks that matter to your application.
              </p>
            </div>
            <Link href="/projects" className="button button-primary shrink-0 px-6 py-3.5 text-sm">
              Open workspace <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
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
