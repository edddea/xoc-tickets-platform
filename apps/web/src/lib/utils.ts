import { randomBytes } from 'crypto';

/** Token aleatorio impredecible (para lookupToken de orden y qrToken). */
export function randomToken(bytes = 16): string {
  return randomBytes(bytes).toString('hex');
}

/** Serializa documentos de Mongo a JSON (ObjectId/Date -> string). */
export function serialize<T = unknown>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc, (_k, v) =>
    v && typeof v === 'object' && v._bsontype === 'ObjectID' ? v.toString() : v
  ));
}

export function money(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}
