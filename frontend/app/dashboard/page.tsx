'use client';

import { useEffect, useState } from 'react';
import ProtectedShell from '@/components/ProtectedShell';
import { mainApi } from '@/lib/api';

interface Item {
  id: string;
  title: string;
  body?: string;
  created_at: string;
}

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await mainApi.get('/api/items');
      setItems(data.items || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          'Could not load items — check that main-service is running and Supabase is configured.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await mainApi.post('/api/items', { title, body });
      setTitle('');
      setBody('');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Could not create item');
    }
  };

  const onDelete = async (id: string) => {
    try {
      await mainApi.delete(`/api/items/${id}`);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Could not delete item');
    }
  };

  return (
    <ProtectedShell>
      <span className="font-mono text-xs tracking-widest text-signal uppercase">main-service · Supabase</span>
      <h1 className="font-display text-3xl mt-2 mb-2">Your items</h1>
      <p className="text-[#9AA3B5] mb-8 max-w-xl">
        Sample CRUD resource proxied straight through main-service to a Supabase{' '}
        <code className="font-mono text-signal">items</code> table, cached in Redis. Replace this with your
        actual hackathon data model.
      </p>

      <form onSubmit={onCreate} className="flex gap-3 mb-8 flex-wrap">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="flex-1 min-w-[160px] bg-[#111623] border border-wire rounded-md px-3 py-2 text-paper focus:border-signal outline-none"
        />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body (optional)"
          className="flex-[2] min-w-[200px] bg-[#111623] border border-wire rounded-md px-3 py-2 text-paper focus:border-signal outline-none"
        />
        <button type="submit" className="bg-signal text-ink font-medium rounded-md px-5 py-2">
          Add
        </button>
      </form>

      {error && (
        <p className="text-rose-400 text-sm font-mono mb-6 border border-rose-900 bg-rose-950/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-[#9AA3B5] font-mono text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[#9AA3B5] font-mono text-sm">No items yet — add one above.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="border border-wire rounded-lg px-4 py-3 flex items-start justify-between gap-4 bg-[#111623]"
            >
              <div>
                <div className="text-paper">{item.title}</div>
                {item.body && <div className="text-[#9AA3B5] text-sm mt-1">{item.body}</div>}
              </div>
              <button onClick={() => onDelete(item.id)} className="text-rose-400 font-mono text-xs shrink-0">
                delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </ProtectedShell>
  );
}
