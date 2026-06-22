import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect('/admin');

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / marca */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Xoc Tickets</h1>
          <p className="mt-1 text-sm text-neutral-500">Acceso exclusivo para staff</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold">Iniciar sesión</h2>
          <p className="mt-0.5 text-sm text-neutral-400">Administradores, organizadores y validadores.</p>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          ¿Eres comprador? <a href="/" className="text-emerald-600 hover:underline">Ver eventos disponibles</a>
        </p>
      </div>
    </div>
  );
}
