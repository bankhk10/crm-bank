import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  DEFAULT_AUTH_REDIRECT,
  getDefaultRouteForRoles,
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
    const roles = session.user.roles ?? [];
    const permissions = session.user.permissions ?? {};

    if (isPublic && pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL(getDefaultRouteForRoles(roles), nextUrl.origin));
    }

    if (!isPublic && !isAuthorized(pathname, permissions)) {
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
