import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Only run this middleware for API routes that require authentication
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/auth/') &&
      !request.nextUrl.pathname.startsWith('/api/fpl/verify-team')) {
    
    // Get the token and check if it's valid
    const token = await getToken({ req: request });
    
    // If no token or token is expired, return a 401 with a specific header
    if (!token) {
      return NextResponse.json(
        { error: 'Session expired', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Configure which paths this middleware is applied to
export const config = {
  matcher: [
    '/api/:path*'
  ]
};