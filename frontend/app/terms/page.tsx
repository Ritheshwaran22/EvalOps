import Link from 'next/link';
import TopNav from '@/components/TopNav';
import { ShieldAlert, Scale, FileText, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export default function Terms() {
  return (
    <>
      <TopNav />
      <main className="shell max-w-4xl py-14 md:py-20">
        <div className="eyebrow mb-4 flex items-center gap-2">
          <span className="h-px w-6 bg-violet" />
          Legal &amp; Operating Agreement
        </div>
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">Terms of Service</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>Effective Date: October 19, 2026</span>
          <span>·</span>
          <span>Last Updated: October 20, 2026</span>
        </div>

        <p className="mt-8 max-w-3xl leading-7 text-zinc-300">
          Welcome to EvalOps. These Terms of Service (&ldquo;Terms&rdquo;) constitute a binding agreement between you
          (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and the operator of this EvalOps instance
          (&ldquo;Operator,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;) governing your access to and use of the
          EvalOps web application, REST API, command-line interfaces, and evaluation tooling (collectively, the &ldquo;Service&rdquo;).
        </p>

        {/* Quick jump navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-y border-line py-4 text-xs">
          <a href="#acceptance" className="text-zinc-400 hover:text-violet transition-colors">1. Acceptance &amp; Eligibility</a>
          <span className="text-zinc-700">·</span>
          <a href="#accounts" className="text-zinc-400 hover:text-violet transition-colors">2. Account Security</a>
          <span className="text-zinc-700">·</span>
          <a href="#acceptable-use" className="text-zinc-400 hover:text-violet transition-colors">3. Acceptable Use</a>
          <span className="text-zinc-700">·</span>
          <a href="#user-content" className="text-zinc-400 hover:text-violet transition-colors">4. User Content &amp; Legality</a>
          <span className="text-zinc-700">·</span>
          <a href="#ownership" className="text-zinc-400 hover:text-violet transition-colors">5. IP &amp; Project Ownership</a>
          <span className="text-zinc-700">·</span>
          <a href="#limitations" className="text-zinc-400 hover:text-violet transition-colors">6. Evaluation Limitations</a>
          <span className="text-zinc-700">·</span>
          <a href="#third-parties" className="text-zinc-400 hover:text-violet transition-colors">7. External Providers</a>
          <span className="text-zinc-700">·</span>
          <a href="#availability" className="text-zinc-400 hover:text-violet transition-colors">8. Availability &amp; Termination</a>
          <span className="text-zinc-700">·</span>
          <a href="#disclaimers" className="text-zinc-400 hover:text-violet transition-colors">9. Disclaimers &amp; Liability</a>
          <span className="text-zinc-700">·</span>
          <a href="#governing-law" className="text-zinc-400 hover:text-violet transition-colors">10. Governance &amp; Notice</a>
        </div>

        <div className="mt-12 space-y-12">
          {/* 1. Acceptance & Eligibility */}
          <section id="acceptance" className="scroll-mt-6">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <Scale size={18} className="text-violet" /> 1. Acceptance of Terms &amp; Eligibility
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                By creating an account, running an evaluation via the web interface or CLI, sending API requests, or otherwise accessing the Service, you confirm that you have read, understood, and agreed to be bound by these Terms and our <Link href="/privacy" className="text-violet hover:underline">Privacy Policy</Link>.
              </p>
              <p>
                You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to use the Service. If you are accessing the Service on behalf of an organization, company, or other legal entity, you represent and warrant that you possess full legal authority to bind that entity to these Terms.
              </p>
            </div>
          </section>

          {/* 2. Account Registration & Security */}
          <section id="accounts" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <ShieldAlert size={18} className="text-violet" /> 2. Account Registration, Security &amp; Responsibilities
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                To access project workspaces, users must register an account by providing an authentic email address and password. You agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Maintain the absolute confidentiality of your account password, API bearer tokens, and session credentials.</li>
                <li>Immediately notify the deployment administrator of any suspected unauthorized access or credential compromise.</li>
                <li>Accept full responsibility for all evaluations, configuration updates, and resource deletions performed under your account credentials.</li>
              </ul>
              <p>
                EvalOps implements bcrypt password hashing and cryptographic session verification. However, account security is fundamentally shared: you are responsible for using strong, unique passwords and safeguarding your local environment.
              </p>
            </div>
          </section>

          {/* 3. Acceptable Use */}
          <section id="acceptable-use" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <AlertTriangle size={18} className="text-violet" /> 3. Acceptable Use &amp; Prohibited Activities
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              You agree to use EvalOps solely for lawful evaluation, quality assurance, and regression testing purposes. You shall not:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1.5 text-sm leading-6 text-zinc-400">
              <li>Attempt to circumvent workspace isolation, access another user&rsquo;s projects, runs, or test cases, or probe for Insecure Direct Object Reference (IDOR) vulnerabilities.</li>
              <li>Launch denial-of-service attacks, bypass sliding-window authentication rate limits, or overwhelm API endpoints with abusive automated request volumes.</li>
              <li>Upload malicious code, exploits, or structured payloads designed to compromise server integrity, execute arbitrary code, or extract master secret keys.</li>
              <li>Use the Service to generate, evaluate, or distribute content that violates applicable laws, encourages violence, infringes third-party intellectual property, or violates external AI provider policies.</li>
            </ul>
          </section>

          {/* 4. User Content & Legality */}
          <section id="user-content" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <FileText size={18} className="text-violet" /> 4. User Content, Prompts &amp; Authorization
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                You retain sole and exclusive responsibility for all test cases, prompt texts, expected outputs, candidate outputs, dataset files, and credentials submitted to the Service (&ldquo;User Content&rdquo;).
              </p>
              <p>
                You represent and warrant that you own or hold all necessary licenses, permissions, and lawful authority to upload and evaluate your User Content, and that your User Content does not violate any third-party privacy rights, contractual non-disclosure agreements, copyright, or data protection laws.
              </p>
            </div>
          </section>

          {/* 5. Ownership & IP */}
          <section id="ownership" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-violet" /> 5. Intellectual Property Rights &amp; Limited License
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                <strong className="text-zinc-200">Ownership of User Content:</strong> You retain all intellectual property rights and title to your User Content. EvalOps claims no ownership over your prompts, application outputs, evaluation criteria, or regression analysis results.
              </p>
              <p>
                <strong className="text-zinc-200">Limited License to Operate:</strong> You grant the Service only the limited, non-exclusive, revocable license strictly necessary to store, parse, execute assertion algorithms against, and display your User Content within your isolated workspace.
              </p>
              <p>
                <strong className="text-zinc-200">EvalOps Project Ownership:</strong> The EvalOps project name, application software, interfaces, database schemas, documentation, and design systems are the intellectual property of the EvalOps project. Third-party software dependencies (including React, Next.js, FastAPI, SQLAlchemy, TailwindCSS, Lucide, and Recharts) remain the property of their respective copyright holders and are subject to their respective licenses.
              </p>
            </div>
          </section>

          {/* 6. Evaluation Limitations */}
          <section id="limitations" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
              <HelpCircle size={18} className="text-violet" /> 6. Evaluation Results &amp; Accuracy Limitations
            </h2>
            <div className="mt-3 border border-amber-900/60 bg-amber-950/10 p-5 rounded space-y-3 text-xs leading-6 text-amber-200/90">
              <div className="font-semibold text-amber-100 text-sm">CRITICAL NOTICE REGARDING AI EVALUATION LIMITATIONS:</div>
              <p>
                EvalOps is an engineering verification and regression testing utility. It executes deterministic assertions (such as exact string comparisons, regular expressions, JSON schema checks, and latency measurements) against supplied outputs.
              </p>
              <p>
                <strong>A passing evaluation run, high pass rate, or satisfied release gate DOES NOT guarantee that an AI model or application is correct, safe, unbiased, legally compliant, secure, free of hallucinations, or suitable for production deployment.</strong>
              </p>
              <p>
                You are solely responsible for designing comprehensive test suites, establishing appropriate release gates, and making all final deployment and release decisions for your software applications.
              </p>
            </div>
          </section>

          {/* 7. External Providers */}
          <section id="third-parties" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100">7. External AI Providers &amp; Integrations</h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                When you configure an external OpenAI-compatible model provider, the Service transmits evaluation prompts to the third-party endpoint specified by you.
              </p>
              <p>
                Third-party providers operate under their own independent terms of service, billing schedules, and privacy practices. EvalOps does not control, endorse, or accept liability for third-party provider availability, latency, response quality, content filtering, data handling, or API changes. You are solely responsible for all API usage fees incurred with external providers.
              </p>
            </div>
          </section>

          {/* 8. Availability & Termination */}
          <section id="availability" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100">8. Service Availability, Maintenance &amp; Account Termination</h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Deployments do not guarantee uninterrupted uptime, immediate error resolution, or established service level agreements (SLAs). Scheduled or emergency maintenance may occur without prior notice.
              </p>
              <p>
                Operators reserve the right to suspend, restrict, or terminate account access, revoke active sessions, or delete projects without liability if a user violates these Terms, poses a security threat, or engages in abusive activities.
              </p>
            </div>
          </section>

          {/* 9. Disclaimers & Liability */}
          <section id="disclaimers" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100">9. Disclaimers of Warranties &amp; Limitations of Liability</h2>
            <div className="mt-3 space-y-4 text-xs leading-6 text-zinc-400">
              <p className="uppercase text-zinc-300 font-mono">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p className="uppercase text-zinc-300 font-mono">
                IN NO EVENT SHALL EVALOPS CONTRIBUTORS, MAINTAINERS, OR DEPLOYMENT OPERATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA LOSS, LOSS OF GOODWILL, WORK STOPPAGE, OR SYSTEM OUTAGES ARISING OUT OF OR IN CONNECTION WITH THE USE OF OR INABILITY TO USE THE SERVICE, OR PRODUCTION RELEASE DECISIONS MADE IN RELIANCE UPON EVALUATION RESULTS.
              </p>
            </div>
          </section>

          {/* 10. Governance & Notice */}
          <section id="governing-law" className="scroll-mt-6 border-t border-line pt-10">
            <h2 className="text-xl font-medium text-zinc-100">10. Governing Law, Dispute Resolution &amp; Operator Decisions</h2>
            <div className="mt-3 space-y-4 text-sm leading-6 text-zinc-400">
              <div className="border border-line bg-[#101016] p-4 rounded text-xs leading-6">
                <div className="font-semibold text-zinc-200 mb-1">Notice for Deployment Operators:</div>
                EvalOps is distributed as a self-hostable software project without an assumed corporate entity or predefined legal jurisdiction. Before offering access to third parties or operating commercially, the operating individual or organization must determine and specify the applicable governing law, jurisdiction, and formal dispute resolution venue (e.g., arbitration or courts) in this section.
              </div>
              <p>
                <strong className="text-zinc-200">Changes to Terms:</strong> We reserve the right to modify these Terms to reflect software updates, architectural changes, or evolving legal obligations. Revisions become effective immediately upon posting with an updated &ldquo;Last Updated&rdquo; date. Continued use of the Service following modifications indicates acceptance of the amended Terms.
              </p>
              <p className="text-xs text-zinc-500">
                <strong className="text-zinc-400">Legal Review Disclaimer:</strong> These Terms of Service provide an operational legal baseline describing the actual software behavior. They do not constitute formal legal advice. Operators should have a qualified attorney licensed in their jurisdiction review and adapt these terms prior to commercial deployment.
              </p>
            </div>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-14 border-t border-line pt-8 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex gap-4 text-zinc-400">
            <Link href="/privacy" className="text-violet hover:underline">Privacy Policy</Link>
            <span>·</span>
            <Link href="/docs" className="text-violet hover:underline">Documentation</Link>
            <span>·</span>
            <Link href="/projects" className="text-violet hover:underline">Workspace Projects</Link>
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
            <Link href="/privacy" className="hover:text-zinc-200 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-violet hover:underline">
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
