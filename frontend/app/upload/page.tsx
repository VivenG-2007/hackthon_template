'use client';

import { useRef, useState } from 'react';
import ProtectedShell from '@/components/ProtectedShell';
import { aiApi, filesApi } from '@/lib/api';

export default function UploadPage() {
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [chatting, setChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<{ originalName: string; sizeBytes: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setChatting(true);
    setChatError(null);
    setReply(null);
    try {
      const { data } = await aiApi.chat({ messages: [{ role: 'user', content: prompt }] });
      setReply(data.content);
    } catch (err: any) {
      setChatError(
        err?.response?.data?.error?.message ||
          'AI request failed — check that ai-storage-service is running and reachable from main-service.'
      );
    } finally {
      setChatting(false);
    }
  };

  const onUpload = async () => {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { data } = await filesApi.upload(file);
      setLastUpload({ originalName: data.file.originalName, sizeBytes: data.file.sizeBytes });
    } catch (err: any) {
      setUploadError(
        err?.response?.data?.error?.message ||
          'Upload failed — check that AZURE_STORAGE_CONNECTION_STRING is set on ai-storage-service.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedShell>
      <span className="font-mono text-xs tracking-widest text-signal uppercase">ai-storage-service</span>
      <h1 className="font-display text-3xl mt-2 mb-2">AI & files</h1>
      <p className="text-[#9AA3B5] mb-10 max-w-xl">
        Both calls travel through main-service&apos;s <code className="font-mono text-signal">/api/proxy</code>{' '}
        route, which forwards your token to ai-storage-service. It verifies the token itself before touching
        the AI provider or Azure Blob.
      </p>

      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <h2 className="font-mono text-sm text-[#9AA3B5] uppercase tracking-widest mb-3">Chat</h2>
          <form onSubmit={onChat} className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Ask the configured AI_PROVIDER something…"
              className="w-full bg-[#111623] border border-wire rounded-md px-3 py-2 text-paper focus:border-signal outline-none resize-none"
            />
            <button
              type="submit"
              disabled={chatting}
              className="bg-signal text-ink font-medium rounded-md px-5 py-2 disabled:opacity-50"
            >
              {chatting ? 'Thinking…' : 'Send'}
            </button>
          </form>
          {chatError && <p className="text-rose-400 text-sm font-mono mt-3">{chatError}</p>}
          {reply && (
            <div className="mt-4 border border-wire bg-[#111623] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap">
              {reply}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-mono text-sm text-[#9AA3B5] uppercase tracking-widest mb-3">File upload</h2>
          <input
            ref={fileInput}
            type="file"
            className="block w-full text-sm text-[#9AA3B5] font-mono file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-wire file:text-paper"
          />
          <button
            onClick={onUpload}
            disabled={uploading}
            className="mt-3 bg-signal text-ink font-medium rounded-md px-5 py-2 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Upload to Azure Blob'}
          </button>
          {uploadError && <p className="text-rose-400 text-sm font-mono mt-3">{uploadError}</p>}
          {lastUpload && (
            <p className="mt-4 text-sm font-mono text-emerald-400">
              Stored {lastUpload.originalName} ({(lastUpload.sizeBytes / 1024).toFixed(1)} KB)
            </p>
          )}
        </section>
      </div>
    </ProtectedShell>
  );
}
