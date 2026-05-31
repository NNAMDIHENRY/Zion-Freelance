import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PREFIX = "/auth";

const ROLE_ROUTES = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/client", role: "CLIENT" },
  { prefix: "/freelancer", role: "FREELANCER" }
] as const;

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 🚨 CRITICAL FIX: NEVER run middleware on API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Only require secret when needed
  const secret = process.env.NEXTAUTH_SECRET;

  let token = null;
  try {
    if (secret) {
      token = await getToken({ req: request, secret });
    }
  } catch (err) {
    // 🚨 NEVER crash request if auth fails
    console.error("Middleware auth error:", err);
    token = null;
  }

  const isAuthArea =
    pathname === AUTH_PREFIX || pathname.startsWith(`${AUTH_PREFIX}/`);

  // AUTH PAGES LOGIC
  if (isAuthArea) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // PROTECTED ROUTES
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/client") ||
    pathname.startsWith("/freelancer");

  if (!isProtected) {
    return NextResponse.next();
  }

  // NOT LOGGED IN → LOGIN
  if (!token) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  // EMAIL CHECK SAFETY (avoid crash if undefined)
  if (token?.emailVerified === false) {
    const verify = new URL("/auth/verify-email", request.url);
    verify.searchParams.set("pending", "1");
    return NextResponse.redirect(verify);
  }

  // ROLE CHECK SAFETY
  const role = token?.role;

  for (const route of ROLE_ROUTES) {
    if (pathname.startsWith(route.prefix) && role !== route.role) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/client/:path*",
    "/freelancer/:path*",
    "/auth/:path*"
  ]
};