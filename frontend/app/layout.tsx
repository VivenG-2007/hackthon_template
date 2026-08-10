import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Hackathon Platform Template',
  description: 'Production-grade multi-service starter: auth, main API, AI + storage — wired and ready to hack on.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-display antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
