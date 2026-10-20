import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'EvalOps — LLM evaluation that blocks regressions', description: 'Evaluate model behavior, catch regressions, and make release decisions based on evidence.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
