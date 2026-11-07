import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/');
  if (process.env.NODE_ENV !== 'production') {
    const response = NextResponse.next();
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
    if (isAdmin) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
      response.headers.set('Cache-Control', 'no-store');
    }
    return response;
  }

  const nonce = btoa(crypto.randomUUID());
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://checkout.razorpay.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://lumberjack.razorpay.com",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', policy);
  requestHeaders.set('x-nonce', nonce);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  if (isAdmin) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'no-store');
  }
  return response;
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|manifest.json|icon.svg).*)'],
};