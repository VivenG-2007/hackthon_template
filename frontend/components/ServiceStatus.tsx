'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

type Status = 'checking' | 'up' | 'down';

interface ServiceDef {
  label: string;
  url: string;
}

// Pings each backend's /health from the browser. Useful as a live "is
// everything wired up" indicator during a hackathon demo — and doubles as a
// quick sanity check that CORS / env vars are set correctly.
export default function ServiceStatus() {
  const services: ServiceDef[] = [
    { label: 'auth-service', url: `${process.env.NEXT_PUBLIC_AUTH_API_URL}/health` },
    { label: 'main-service', url: `${process.env.NEXT_PUBLIC_MAIN_API_URL}/health` },
  ];
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    Object.fromEntries(services.map((s) => [s.label, 'checking']))
  );

  useEffect(() => {
    services.forEach((s) => {
      axios
        .get(s.url, { timeout: 4000 })
        .then(() => setStatuses((prev) => ({ ...prev, [s.label]: 'up' })))
        .catch(() => setStatuses((prev) => ({ ...prev, [s.label]: 'down' })));
    });
    // ai-storage-service is intentionally not pinged directly — it's only
    // reached through main-service's proxy in this template.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="border border-wire rounded-lg p-4 font-mono text-sm space-y-2 bg-[#111623]">
      {services.map((s) => (
        <div key={s.label} className="flex items-center justify-between">
          <span className="text-[#9AA3B5]">{s.label}</span>
          <span
            className={
              statuses[s.label] === 'up'
                ? 'text-emerald-400'
                : statuses[s.label] === 'down'
                ? 'text-rose-400'
                : 'text-[#9AA3B5]'
            }
          >
            {statuses[s.label] === 'checking' ? '· · ·' : statuses[s.label] === 'up' ? '● online' : '● unreachable'}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between opacity-60">
        <span className="text-[#9AA3B5]">ai-storage-service</span>
        <span className="text-[#9AA3B5]">behind proxy</span>
      </div>
    </div>
  );
}
