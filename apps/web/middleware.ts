import { NextRequest, NextResponse } from 'next/server';

// Gate LIGERO (corre en edge): solo verifica que exista la cookie de sesión.
// La autorización real por rol se hace en el servidor (layout + API routes),
// por eso NO importamos aquí Auth.js ni MongoDB (no funcionan en edge).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();

  const hasSession =
    req.cookies.has('authjs.session-token') ||
    req.cookies.has('__Secure-authjs.session-token');

  if (!hasSession) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
