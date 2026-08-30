import { NextResponse } from 'next/server'

export function middleware(req) {
  const token = req.cookies.get('token');
  const isLoginPage = req.nextUrl.pathname === '/login';

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api/auth/login|cedim.png|CEDIM_LOGO.jpg|favicon.ico).*)']
}
