import { Role } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PREFIX = "/auth";

const ROLE_ROUTES: Array<{ prefix: string; role: Role }> = [
  { prefix: "/admin", role: Role.ADMIN },
  { prefix: "/client", role: Role.CLIENT },
  { prefix: "/freelancer", role: Role.FREELANCER }
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const secret = process.env.NEXTAUTH_SECRET;
  const token = secret ? await getToken({ req: request, secret }) : null;

  const isAuthArea = pathname === AUTH_PREFIX || pathname.startsWith(`${AUTH_PREFIX}/`);

  if (isAuthArea) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/client") ||
    pathname.startsWith("/freelancer");

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!token) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const role = token.role as Role | undefined;

  for (const { prefix, role: allowed } of ROLE_ROUTES) {
    if (pathname.startsWith(prefix) && role !== allowed) {
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
