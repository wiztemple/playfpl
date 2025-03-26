// /middleware.ts
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Paths that require authentication
const protectedPaths = [
  "/leagues/weekly/create",
  "/leagues/weekly/*/join",
  "/leagues/my-leagues",
  "/profile",
  "/wallet",
];

// Paths that are public
const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/error",
  "/auth/verify-request",
  "/api/auth/*",
];

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  
  // Check if user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if the path matches any protected paths
  const isProtected = protectedPaths.some((path) => {
    if (path.includes("*")) {
      const [prefix, suffix] = path.split("*");
      return (
        nextUrl.pathname.startsWith(prefix) &&
        (suffix === "" || nextUrl.pathname.endsWith(suffix))
      );
    }
    return nextUrl.pathname === path;
  });

  // Allow access to public paths
  const isPublic = publicPaths.some((path) => {
    if (path.includes("*")) {
      const [prefix, suffix] = path.split("*");
      return (
        nextUrl.pathname.startsWith(prefix) &&
        (suffix === "" || nextUrl.pathname.endsWith(suffix))
      );
    }
    return nextUrl.pathname === path;
  });

  // Redirect to sign in if accessing a protected path without authentication
  if (isProtected && !token) {
    const signInUrl = new URL("/api/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  // Allow access to authorized paths or public paths
  return NextResponse.next();
}

export const config = {
  // Specify which paths the middleware should run on
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|images|public).*)",
  ],
};