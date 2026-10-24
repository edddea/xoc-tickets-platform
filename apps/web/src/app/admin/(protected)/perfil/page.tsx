import Link from 'next/link';
import { auth } from '@/lib/auth';
import { col } from '@/lib/db';
import { listarSpeiCuentas } from '@/lib/repo';
import { ObjectId } from 'mongodb';
import type { UserRole } from '@xoc/shared';

export const dynamic = 'force-dynamic';

const ROL_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  organizador: 'Organizador',
  validador: 'Scanner',
};

export default async function PerfilPage() {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  const role = (session?.user as { role?: UserRole } | undefined)?.role;
  if (!uid) return <p className="text-neutral-500">No autenticado.</p>;

  const staff = await col('staff');
  const usuario = await staff.findOne({ _id: new ObjectId(uid) });
  const cuentas = await listarSpeiCuentas(uid);

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <p className="mt-1 text-sm text-neutral-500">{usuario?.correo}</p>
      {role && <p className="text-sm text-neutral-400">{ROL_LABEL[role]}</p>}

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Secciones</h2>
        <Link
          href="/admin/perfil/spei"
          className="mt-3 flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div>
            <p className="font-semibold">💳 Cuentas SPEI</p>
            <p className="text-sm text-neutral-500">
              Administra las cuentas de pago que asocias a tus eventos.
            </p>
          </div>
          <span className="text-sm text-neutral-400">
            {cuentas.length} {cuentas.length === 1 ? 'cuenta' : 'cuentas'} →
          </span>
        </Link>
      </div>
    </div>
  );
}
