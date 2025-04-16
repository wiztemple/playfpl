
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log(`[Middleware] Path: ${pathname}`); // Log path for debugging

  // --- Admin Route Protection ---
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });
    // Redirect to signin if not authenticated OR if not an admin
    // Assuming isAdmin flag is available in the token via callbacks
    if (!token || !(token as any).isAdmin) { // Check for token AND isAdmin flag
      console.log(`[Middleware] Unauthorized admin access attempt by token: ${token ? 'exists (not admin)' : 'missing'}. Redirecting.`);
      // Redirect to a non-admin page, like the weekly leagues list
      const redirectUrl = new URL('/leagues/weekly', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    console.log('[Middleware] Admin access granted.');
    // If admin, allow request to proceed
    return NextResponse.next();
  }

  // --- Existing API Route Protection ---
  if (pathname.startsWith('/api/')) {
    // List of API routes accessible without authentication
    const publicApiRoutes = [
      '/api/auth/', // All auth routes
      '/api/fpl/verify-team',
      '/api/gameweek/'
    ];

    // Special case for public leagues endpoint
    let isLeaguesPublicRoute = false;
    if (pathname.startsWith('/api/leagues/weekly') && request.method === 'GET') {
      const filter = request.nextUrl.searchParams.get('filter');
      isLeaguesPublicRoute = filter !== 'my-leagues';
    }

    const isPublicRoute = publicApiRoutes.some(route => pathname.startsWith(route)) || isLeaguesPublicRoute;

    // Only run authentication check for non-public API routes
    if (!isPublicRoute) {
      const token = await getToken({ req: request });
      if (!token) {
        console.log(`[Middleware] API route ${pathname} requires authentication. No token found.`);
        return NextResponse.json(
          { error: 'Authentication required', code: 'SESSION_EXPIRED' },
          { status: 401 }
        );
      }
       console.log(`[Middleware] API route ${pathname} access granted.`);
    } else {
         console.log(`[Middleware] Public API route ${pathname} accessed.`);
    }
  }

  // Allow all other requests (e.g., public pages, static files)
  return NextResponse.next();
}

// --- UPDATED Matcher ---
// Apply middleware to BOTH API routes AND Admin page routes
export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*' // Add admin paths here
  ]
};