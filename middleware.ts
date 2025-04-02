import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // List of API routes that should be accessible without authentication
  const publicApiRoutes = [
    '/api/auth/',              // All auth routes including signin, signup, etc.
    '/api/fpl/verify-team',    // Team verification
    '/api/gameweek/'           // Gameweek info
  ];

  // Special case for leagues endpoint - only GET requests without filter=my-leagues are public
  let isLeaguesPublicRoute = false;
  if (request.nextUrl.pathname.startsWith('/api/leagues/weekly') && request.method === 'GET') {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter');
    // Allow viewing all leagues without auth, but require auth for my-leagues
    isLeaguesPublicRoute = filter !== 'my-leagues';
  }

  // Check if the current request path starts with any of the public routes
  const isPublicRoute = publicApiRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  ) || isLeaguesPublicRoute;

  // Only run authentication check for non-public API routes
  if (request.nextUrl.pathname.startsWith('/api/') && !isPublicRoute) {
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