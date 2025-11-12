import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  DEFAULT_AUTH_REDIRECT,
  getDefaultRouteForRole,
  isAuthorized,
  isRoutePublic
} from "@/lib/rbac";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;
  const isPublic = isRoutePublic(pathname);

  if (!session?.user && !isPublic) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  if (session?.user) {
    const role = session.user.role as Role;

    if (isPublic && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL(getDefaultRouteForRole(role), nextUrl.origin));
    }

    if (!isPublic && !isAuthorized(role, pathname)) {
      return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};
