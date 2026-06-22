import { auth } from '@/lib/auth';
import { col } from '@/lib/db';
import { ObjectId } from 'mongodb';
import SpeiForm from './SpeiForm';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const session = await auth();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return <p className="text-neutral-500">No autenticado.</p>;

  const staff = await col('staff');
  const usuario = await staff.findOne({ _id: new ObjectId(uid) });

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold">Mi perfil</h1>
      <p className="mt-1 text-sm text-neutral-500">{usuario?.correo}</p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Datos de pago SPEI</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Estos datos se muestran a los compradores en el formulario de compra de tus eventos.
        </p>
        <SpeiForm uid={uid} spei={usuario?.spei ?? null} />
      </div>
    </div>
  );
}
