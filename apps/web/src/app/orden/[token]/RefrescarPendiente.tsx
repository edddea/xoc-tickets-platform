'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mientras el pago con tarjeta está pendiente, refresca la orden cada pocos
// segundos para reflejar la confirmación del webhook de Stripe en cuanto llega.
export default function RefrescarPendiente() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [router]);
  return (
    <p className="mt-2 text-sm text-neutral-500">
      Confirmando tu pago… esta página se actualizará sola en unos segundos.
    </p>
  );
}
