import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { puedeEscanear } from '@/lib/roles';
import type { UserRole } from '@xoc/shared';
import Scanner from './Scanner';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Escáner de acceso — Xoc Tickets',
};

// /scan -> app de escaneo de boletos para el staff de acceso (rol Scanner).
export default async function ScanPage() {
  const session = await auth();
  if (!session) redirect('/admin/login?callbackUrl=/scan');

  const user = session.user as { name?: string; email?: string; role?: UserRole } | undefined;

  if (!puedeEscanear(user?.role)) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold">No tienes acceso para escanear eventos</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Esta sección es solo para el staff de acceso (rol <strong>Scanner</strong>).
          Si necesitas escanear boletos, pide al administrador una cuenta de Scanner.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/admin" className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:border-neutral-400">
            Ir al panel
          </Link>
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/admin/login?callbackUrl=/scan' }); }}>
            <button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
              Entrar con otra cuenta
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <Scanner nombre={user?.name || user?.email || ''} />;
}
