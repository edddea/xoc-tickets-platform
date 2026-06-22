import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';

export default async function AdminHome() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel {role && `· ${role}`}</h1>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/admin/login' }); }}>
          <button className="text-sm text-neutral-500 hover:text-neutral-900">Cerrar sesión</button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/eventos/nuevo"
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md">
          <h2 className="font-semibold">➕ Crear evento</h2>
          <p className="text-sm text-neutral-500">Registra un nuevo evento y publícalo en el feed.</p>
        </Link>
        <Link href="/admin/reservaciones"
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md">
          <h2 className="font-semibold">🧾 Reservaciones</h2>
          <p className="text-sm text-neutral-500">Revisa comprobantes SPEI y aprueba pagos.</p>
        </Link>
        <Link href="/admin/perfil"
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md">
          <h2 className="font-semibold">👤 Mi perfil</h2>
          <p className="text-sm text-neutral-500">Configura tus datos de pago SPEI.</p>
        </Link>
        {role === 'admin' && (
          <Link href="/admin/staff"
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md">
            <h2 className="font-semibold">👥 Staff</h2>
            <p className="text-sm text-neutral-500">Administra los miembros del equipo y sus roles.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
