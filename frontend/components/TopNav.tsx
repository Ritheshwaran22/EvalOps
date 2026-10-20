'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Hexagon, LogOut, User as UserIcon } from 'lucide-react';
import { getUser, logout, User } from '@/lib/auth';

export default function TopNav() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <header className="border-b border-line">
      <div className="shell flex h-[72px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-violet">
            <Hexagon size={19} />
          </span>
          EvalOps
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link className="navlink" href="/#platform">
            Platform
          </Link>
          <Link className="navlink" href="/docs" prefetch={false}>
            Documentation
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-zinc-400 sm:inline">
                {user.full_name || user.email}
              </span>
              <Link href="/projects" prefetch={false} className="button button-primary">
                Open workspace <ArrowUpRight size={14} />
              </Link>
              <button
                onClick={() => logout()}
                className="button text-zinc-400 hover:text-rose-300"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" prefetch={false} className="button text-zinc-300 hover:text-white">
                Sign in
              </Link>
              <Link href="/register" prefetch={false} className="button button-primary">
                Get started <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
