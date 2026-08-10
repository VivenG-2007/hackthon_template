'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-[#9AA3B5]">Loading…</div>;
  }
  if (!user) return null;

  return (
    <div className="min-h-screen grid-overlay">
      <header className="border-b border-wire">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <nav className="flex gap-6 font-mono text-sm items-center">
            <span className="text-signal">●</span>
            <Link href="/dashboard" className="text-paper">Dashboard</Link>
            <Link href="/upload" className="text-[#9AA3B5] hover:text-paper transition-colors">AI & Files</Link>
          </nav>
          <div className="flex items-center gap-4 font-mono text-sm">
            <span className="text-[#9AA3B5]">{user.email}</span>
            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="text-rose-400 hover:text-rose-300"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-12">{children}</div>
    </div>
  );
}
