import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  DEFAULT_AUTH_REDIRECT,
  getDefaultRouteForRoles,
  isAuthorized,
  isRoutePublic,
} from "@/modules/rbac/application/authorization";

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  const isPublic = isRoutePublic(pathname);

  // Don't try to get session for API routes - they handle their own auth
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user && !isPublic) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  if (session?.user) {
    const roles = session.user.roles ?? [];
    const permissionKeys = session.user.permissionKeys ?? [];

    if (isPublic && pathname.startsWith("/login")) {
      return NextResponse.redirect(
        new URL(getDefaultRouteForRoles(roles), nextUrl.origin),
      );
    }

    if (!isPublic && !isAuthorized(pathname, permissionKeys)) {
      return NextResponse.redirect(
        new URL(DEFAULT_AUTH_REDIRECT, nextUrl.origin),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
