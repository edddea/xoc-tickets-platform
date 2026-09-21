import Stripe from 'stripe';

// Cliente de Stripe del lado servidor (cuenta única de plataforma).
// No lanzamos en el import para no romper el build cuando falta la llave;
// cada ruta que lo use valida con getStripe().
const secret = process.env.STRIPE_SECRET_KEY;
const stripeSingleton = secret ? new Stripe(secret) : null;

export function getStripe(): Stripe {
  if (!stripeSingleton) {
    throw new Error('Falta STRIPE_SECRET_KEY en las variables de entorno');
  }
  return stripeSingleton;
}

export function stripeHabilitado(): boolean {
  return stripeSingleton !== null;
}

/** Comisión de plataforma Xoc sobre cada venta con tarjeta. */
export const PLATFORM_FEE_PERCENT = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '5');

/**
 * Desglosa un total (en centavos) en comisión de plataforma y neto del organizador.
 * En esta fase (cuenta única) el cobro completo cae en la cuenta de Xoc; el desglose
 * se guarda para contabilidad y para migrar a Connect (application_fee) más adelante.
 */
export function desglosarComision(totalCentavos: number) {
  const comision = Math.round((totalCentavos * PLATFORM_FEE_PERCENT) / 100);
  return { comision, neto: totalCentavos - comision };
}
