'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  FlaskConical,
  ListChecks,
  GitCompareArrows,
  Plug,
  Settings,
  Hexagon,
  ArrowLeft,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { getUser, logout, User } from '@/lib/auth';

const items = [
  ['Projects', '/projects', Boxes],
  ['Evaluations', '/runs', FlaskConical],
  ['Test Cases', '/test-cases', ListChecks],
  ['Regression Reports', '/regressions', GitCompareArrows],
  ['Integrations', '/integrations', Plug],
  ['Settings', '/settings', Settings],
] as const;

export default function Sidebar() {
  const path = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <aside className="w-full border-b border-line p-4 md:flex md:w-[230px] md:flex-col md:justify-between md:border-b-0 md:border-r md:min-h-[calc(100vh-73px)]">
      <div>
        <Link href="/" className="mb-7 hidden items-center gap-2 px-3 text-sm font-semibold md:flex">
          <Hexagon size={18} className="text-violet" />
          EvalOps
        </Link>
        <div className="mb-3 px-3 text-[10px] uppercase tracking-[.18em] text-zinc-600">Workspace</div>
        <nav className="grid grid-cols-3 gap-1 md:block md:space-y-1">
          {items.map(([label, href, Icon]) => {
            const isActive = path === href || (href !== '/projects' && path.startsWith(href));
            return (
              <Link
                key={label}
                href={href}
                prefetch={false}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 border-t border-line/60 pt-4 hidden md:block">
        {user ? (
          <div className="px-3">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <UserIcon size={14} className="text-zinc-500" />
              <span className="truncate">{user.full_name || user.email}</span>
            </div>
            <div className="mt-0.5 truncate text-[10px] text-zinc-600">{user.email}</div>
            <button
              onClick={() => logout()}
              className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-rose-300"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        ) : (
          <div className="px-3">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs text-violet hover:underline"
            >
              Sign in to workspace
            </Link>
          </div>
        )}

        <Link href="/" className="mt-4 flex items-center gap-2 px-3 text-xs text-zinc-500 hover:text-zinc-300">
          <ArrowLeft size={13} /> Public site
        </Link>

        <div className="mt-4 border-t border-line/40 pt-3 px-3 text-[10px] text-zinc-600">
          <div className="flex gap-2 text-zinc-500">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/docs" className="hover:text-zinc-300 transition-colors">Docs</Link>
          </div>
          <div className="mt-1.5 text-zinc-600">© 2026 EvalOps. All rights reserved.</div>
        </div>
      </div>
    </aside>
  );
}
