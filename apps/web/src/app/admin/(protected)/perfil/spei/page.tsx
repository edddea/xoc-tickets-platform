import { auth } from '@/lib/auth';
import { listarSpeiCuentas } from '@/lib/repo';
import { serialize } from '@/lib/utils';
import type { SpeiCuenta } from '@xoc/shared';
import SpeiAccounts from './SpeiAccounts';

export const dynamic = 'force-dynamic';

export default async function SpeiPage() {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return <p className="text-neutral-500">No autenticado.</p>;

  const cuentas = serialize<SpeiCuenta[]>(await listarSpeiCuentas(uid));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Cuentas SPEI</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Registra una o varias cuentas para recibir pagos. Al crear un evento eliges cuál usar,
        y esa es la que se muestra a los compradores.
      </p>

      <SpeiAccounts cuentasIniciales={cuentas} />
    </div>
  );
}
