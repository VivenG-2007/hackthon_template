import Link from 'next/link';
import ServiceStatus from '@/components/ServiceStatus';

export default function LandingPage() {
  return (
    <main className="min-h-screen grid-overlay">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-24">
          <span className="font-mono text-xs tracking-widest text-signal uppercase">Hackathon Platform Template</span>
          <nav className="flex gap-6 font-mono text-sm">
            <Link href="/login" className="text-[#9AA3B5] hover:text-paper transition-colors">Log in</Link>
            <Link href="/login?mode=register" className="text-paper border-b border-signal">Get started</Link>
          </nav>
        </div>

        <h1 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight max-w-3xl">
          One frontend.<br />
          Three backends.<br />
          <span className="text-signal">Zero infra decisions left.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[#9AA3B5] text-lg leading-relaxed">
          Auth issues the tokens. Main handles your product logic against Supabase and Redis.
          AI + Storage handles models, files, and Mongo. Every service verifies its own JWTs —
          nothing here waits on anything else to survive.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4 font-mono text-sm">
            {[
              ['01', 'auth-service', 'RS256 tokens · httpOnly cookies · refresh rotation'],
              ['02', 'main-service', 'Supabase + Redis · rate limiting · your product API'],
              ['03', 'ai-storage-service', 'Pluggable AI provider · Mongo · Azure Blob'],
              ['04', 'frontend', 'Next.js on Vercel · edge-verified routes'],
            ].map(([n, name, desc]) => (
              <div key={name} className="flex gap-4 border-l border-wire pl-4 py-1">
                <span className="text-signal">{n}</span>
                <div>
                  <div className="text-paper">{name}</div>
                  <div className="text-[#9AA3B5] text-xs mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs font-mono text-[#9AA3B5] mb-2 uppercase tracking-widest">Live status</div>
            <ServiceStatus />
            <p className="mt-3 text-xs text-[#9AA3B5] font-mono leading-relaxed">
              Set NEXT_PUBLIC_AUTH_API_URL / NEXT_PUBLIC_MAIN_API_URL in .env.local and start the backends
              to see this go green.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
