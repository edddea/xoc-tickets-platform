import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Xoc Tickets',
  description: 'Compra boletos para los mejores eventos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold tracking-tight">
              🎟️ Xoc Tickets
            </Link>
            <Link href="/admin/login" className="text-sm text-neutral-500 hover:text-neutral-900">
              Acceso staff
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
          xoc-tickets.com
        </footer>
      </body>
    </html>
  );
}
