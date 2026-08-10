import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, importSPKI } from 'jose';

// Runs at the edge before /dashboard and /upload render. This is a UX
// short-circuit (fast redirect to /login for an obviously missing/expired
// cookie) — it is NOT a substitute for each backend verifying the token
// itself, which they all still do independently.
const PROTECTED_PREFIXES = ['/dashboard', '/upload'];

function decodeKey(base64Value: string | undefined) {
  if (!base64Value) return null;
  try {
    return Buffer.from(base64Value, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get('access_token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  const publicKeyPem = decodeKey(process.env.JWT_PUBLIC_KEY_BASE64);
  if (!publicKeyPem) {
    // Key not configured for this deployment — fall back to letting the
    // client-side AuthContext + backend 401s handle protection instead of
    // hard-blocking every request.
    return NextResponse.next();
  }

  try {
    const key = await importSPKI(publicKeyPem, 'RS256');
    await jwtVerify(token, key, {
      issuer: process.env.JWT_ISSUER || 'hackathon-auth-service',
      audience: process.env.JWT_AUDIENCE || 'hackathon-platform',
    });
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/upload/:path*'],
};
