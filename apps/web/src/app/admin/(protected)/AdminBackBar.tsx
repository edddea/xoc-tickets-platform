'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Etiqueta amigable del destino al que regresa el botón.
const PARENT_LABEL: Record<string, string> = {
  '/admin': 'Panel',
  '/admin/perfil': 'Mi perfil',
  '/admin/staff': 'Staff',
  '/admin/mis-eventos': 'Mis eventos',
};

// Rutas cuyo "padre" por segmento no existe como página: regresan al panel.
const SIN_INDEX = new Set(['/admin/eventos']);

function rutaPadre(pathname: string): string {
  const padre = pathname.replace(/\/[^/]+$/, '');
  if (!padre || padre === '/admin' || SIN_INDEX.has(padre)) return '/admin';
  return padre;
}

/** Barra de navegación estilo mobile: botón "volver" en cada sección de admin. */
export default function AdminBackBar() {
  const pathname = usePathname();
  // En el panel principal no se muestra (es la raíz de la navegación).
  if (pathname === '/admin') return null;

  const padre = rutaPadre(pathname);
  const label = PARENT_LABEL[padre] ?? 'Volver';

  return (
    <div className="mb-4">
      <Link
        href={padre}
        className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {label}
      </Link>
    </div>
  );
}
