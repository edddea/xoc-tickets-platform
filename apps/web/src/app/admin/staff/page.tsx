import Link from 'next/link';
import { auth } from '@/lib/auth';
import { col } from '@/lib/db';
import { serialize } from '@/lib/utils';
import type { UserRole } from '@xoc/shared';

export const dynamic = 'force-dynamic';

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

export default async function StaffPage() {
  const session = await auth();
  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  if (role !== 'admin') {
    return <p className="text-neutral-500">No tienes permiso para ver esta sección.</p>;
  }

  const staff = await col('staff');
  const lista = serialize<any[]>(await staff.find({}).sort({ createdAt: -1 }).toArray());

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff</h1>
        <Link href="/admin/staff/nuevo"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          + Nuevo miembro
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {lista.map((u) => (
          <div key={u._id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-medium">{u.nombre}</p>
              <p className="text-xs text-neutral-400">{u.correo}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROL_COLOR[u.role as UserRole]}`}>
              {ROL_LABEL[u.role as UserRole] ?? u.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
