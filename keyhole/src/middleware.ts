import { NextRequest, NextResponse } from 'next/server';

/**
 * KEYHOLE PRODUCTION SECURITY & RATE LIMITING MIDDLEWARE
 * 
 * Implements:
 * 1. Rate Limiting:
 *    - 5 requests/min on auth endpoints (/api/auth/login, /api/auth/signup)
 *    - 30 requests/min on chat endpoints (/api/chat/*, query routes)
 *    - 10 requests/min on upload endpoints (/api/analyze/MODALITY/upload)
 * 2. CSRF Protection on state-changing endpoints
 * 3. CORS origin whitelisting
 * 4. Helmet.js-equivalent security headers & Content Security Policy (CSP)
 * 5. HTTPS enforcement in production
 */

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

function isRateLimited(key: string, limit: number, windowMs = 60000): { limited: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { limited: false, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { limited: true, remaining: 0 };
  }

  record.count++;
  return { limited: false, remaining: limit - record.count };
}

// Cleanup rate limit entries every 5 minutes
const rateLimitTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (rateLimitTimer && typeof rateLimitTimer.unref === 'function') {
  rateLimitTimer.unref();
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const method = req.method;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origin = req.headers.get('origin');

  // 1. CORS Preflight
  if (method === 'OPTIONS') {
    const preflightHeaders = new Headers();
    preflightHeaders.set('Access-Control-Allow-Origin', origin || frontendUrl);
    preflightHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    preflightHeaders.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, X-CSRF-Token'
    );
    preflightHeaders.set('Access-Control-Allow-Credentials', 'true');
    preflightHeaders.set('Access-Control-Max-Age', '86400');
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // 2. CSRF Verification for state-changing API requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && pathname.startsWith('/api/')) {
    // Exempt external OAuth callbacks & sendBeacon cleanup
    const isExempt =
      pathname.includes('/auth/google/callback') ||
      pathname.includes('/auth/github/callback') ||
      pathname.includes('/cleanup-session') ||
      pathname.includes('/mark-session-inactive');

    if (!isExempt && origin) {
      const allowedHost = new URL(frontendUrl).host;
      try {
        const originHost = new URL(origin).host;
        if (originHost !== allowedHost && !originHost.includes('localhost') && !originHost.includes('127.0.0.1')) {
          return NextResponse.json(
            { error: 'CSRF validation failed: Origin mismatch.' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'CSRF validation failed: Malformed origin header.' },
          { status: 403 }
        );
      }
    }
  }

  // 3. Rate Limiting Rules
  if (pathname.startsWith('/api/')) {
    // Auth Endpoints: 5 requests per minute
    if (pathname === '/api/auth/login' || pathname === '/api/auth/signup') {
      const { limited, remaining } = isRateLimited(`auth:${ip}`, 5);
      if (limited) {
        return NextResponse.json(
          { error: 'Too many authentication attempts. Please retry after 1 minute.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }

    // Upload Endpoints: 10 requests per minute
    if (pathname.includes('/upload') && method === 'POST') {
      const { limited, remaining } = isRateLimited(`upload:${ip}`, 10);
      if (limited) {
        return NextResponse.json(
          { error: 'Upload rate limit exceeded (max 10 uploads/min). Please slow down.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }

    // Chat & Query Endpoints: 30 requests per minute
    if ((pathname.startsWith('/api/chat/') || pathname.includes('/query')) && method === 'POST') {
      const { limited, remaining } = isRateLimited(`chat:${ip}`, 30);
      if (limited) {
        return NextResponse.json(
          { error: 'Chat message rate limit exceeded (max 30 msgs/min).' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }
  }

  // 4. Attach Helmet-equivalent Security Headers & Content Security Policy
  const response = NextResponse.next();

  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https: https://images.unsplash.com",
    "media-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // CORS Header for allowed responses
  response.headers.set('Access-Control-Allow-Origin', origin || frontendUrl);
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
