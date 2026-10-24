import type { UserRole } from '@xoc/shared';

// Quién puede usar el escáner de boletos (/scan).
// 'validador' es el rol "Scanner" del staff de acceso; el admin también puede.
export const ROLES_SCAN: UserRole[] = ['validador', 'admin'];

export function puedeEscanear(role?: UserRole | null): boolean {
  return !!role && ROLES_SCAN.includes(role);
}
