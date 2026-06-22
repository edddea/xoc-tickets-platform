import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import type { UserRole } from '@xoc/shared';

const ROL_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  organizador: 'Organizador',
  validador: 'Validador',
};

const ROL_COLOR: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  organizador: 'bg-blue-100 text-blue-700',
  validador: 'bg-neutral-100 text-neutral-600',
};

export default async function AdminHome() {
  const session = await auth();
  const user = session?.user as { name?: string; email?: string; role?: UserRole } | undefined;
  const role = user?.role;

  return (
    <div>
      {/* Header con info de sesión */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="font-semibold">{user?.name || user?.email}</p>
          <p className="text-xs text-neutral-400">{user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {role && (
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${ROL_COLOR[role]}`}>
              {ROL_LABEL[role]}
            </span>
          )}
          <form action={async () => { 'use server'; await signOut({ redirectTo: '/admin/login' }); }}>
            <button className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-800 transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>

      <h1 className="mt-6 text-xl font-bold">Panel de control</h1>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/eventos/nuevo"
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-semibold">➕ Crear evento</h2>
          <p className="text-sm text-neutral-500">Registra un nuevo evento y publícalo en el feed.</p>
        </Link>
        <Link href="/admin/reservaciones"
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-semibold">🧾 Reservaciones</h2>
          <p className="text-sm text-neutral-500">Revisa comprobantes SPEI y aprueba pagos.</p>
        </Link>
        <Link href="/admin/perfil"
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="font-semibold">👤 Mi perfil</h2>
          <p className="text-sm text-neutral-500">Configura tus datos de pago SPEI.</p>
        </Link>
        {role === 'admin' && (
          <Link href="/admin/staff"
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="font-semibold">👥 Staff</h2>
            <p className="text-sm text-neutral-500">Administra los miembros del equipo y sus roles.</p>
          </Link>
        )}
      </div>
    </div>
  );
}
