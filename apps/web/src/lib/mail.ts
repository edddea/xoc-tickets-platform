import sgMail from '@sendgrid/mail';
import QRCode from 'qrcode';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface TicketInfo {
  id: string;
  qrToken: string;
  seccion: string;
}

interface EnviarBoletosParams {
  correo: string;
  nombre: string;
  eventoTitulo: string;
  eventoFecha: string;
  eventoVenue: string;
  ordenId: string;
  lookupToken: string;
  tickets: TicketInfo[];
}

export async function enviarBoletos(params: EnviarBoletosParams) {
  const { correo, nombre, eventoTitulo, eventoFecha, eventoVenue, ordenId, lookupToken, tickets } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Genera QR como data URL para cada boleto
  const ticketsHtml = await Promise.all(
    tickets.map(async (t) => {
      const qrDataUrl = await QRCode.toDataURL(t.qrToken, { width: 180, margin: 2 });
      return `
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:12px;display:inline-block;width:180px;text-align:center;vertical-align:top;margin-right:8px;">
          <img src="${qrDataUrl}" alt="QR" width="160" height="160" style="display:block;margin:0 auto;" />
          <p style="margin:8px 0 2px;font-weight:600;font-size:13px;">Boleto #${t.id.slice(-6).toUpperCase()}</p>
          <p style="margin:0;font-size:12px;color:#6b7280;">${t.seccion}</p>
        </div>`;
    })
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:sans-serif;color:#111;max-width:600px;margin:0 auto;padding:24px;">
      <h1 style="font-size:22px;margin-bottom:4px;">¡Tus boletos están listos! 🎉</h1>
      <p style="color:#6b7280;margin-top:0;">Hola ${nombre}, tu compra fue aprobada.</p>

      <div style="background:#f9fafb;border-radius:10px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 4px;font-size:18px;font-weight:700;">${eventoTitulo}</p>
        <p style="margin:0;color:#6b7280;font-size:14px;">${eventoFecha} · ${eventoVenue}</p>
      </div>

      <p style="font-weight:600;">Presenta cualquiera de estos QR en la entrada:</p>
      <div style="margin:16px 0;">
        ${ticketsHtml.join('')}
      </div>

      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
        <p style="font-size:13px;color:#6b7280;">
          También puedes consultar tu orden completa en:<br/>
          <a href="${appUrl}/orden/${lookupToken}" style="color:#059669;">${appUrl}/orden/${lookupToken}</a>
        </p>
        <p style="font-size:12px;color:#9ca3af;">Orden #${ordenId.slice(-6).toUpperCase()}</p>
      </div>
    </body>
    </html>`;

  await sgMail.send({
    to: correo,
    from: process.env.MAIL_FROM || 'boletos@xoc-tickets.com',
    subject: `Tus boletos para ${eventoTitulo}`,
    html,
  });
}
