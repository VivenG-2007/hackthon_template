'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const isRegister = params.get('mode') === 'register';
  const { login, register, error } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      router.push('/dashboard');
    } catch {
      // error is already surfaced via useAuth().error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen grid-overlay flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <span className="font-mono text-xs tracking-widest text-signal uppercase">
          {isRegister ? 'Create account' : 'Log in'}
        </span>
        <h1 className="font-display text-3xl mt-2 mb-8">{isRegister ? 'Join the platform' : 'Welcome back'}</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block font-mono text-xs text-[#9AA3B5] mb-1">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#111623] border border-wire rounded-md px-3 py-2 text-paper focus:border-signal outline-none"
              />
            </div>
          )}
          <div>
            <label className="block font-mono text-xs text-[#9AA3B5] mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111623] border border-wire rounded-md px-3 py-2 text-paper focus:border-signal outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-[#9AA3B5] mb-1">Password</label>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111623] border border-wire rounded-md px-3 py-2 text-paper focus:border-signal outline-none"
            />
          </div>

          {error && <p className="text-rose-400 text-sm font-mono">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-signal text-ink font-medium rounded-md py-2 disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Working…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-[#9AA3B5] font-mono">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <Link href={isRegister ? '/login' : '/login?mode=register'} className="text-signal">
            {isRegister ? 'Log in' : 'Register'}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
