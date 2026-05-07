import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const userRoutes = ["/dashboard", "/profile", "/assessment", "/history", "/result"];

function isUserRoute(pathname: string) {
  return userRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (pathname.startsWith("/admin")) {
    if (token?.role !== "ADMIN") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  if (isUserRoute(pathname) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/register") && token) {
    const dashboardUrl = new URL(token.role === "ADMIN" ? "/admin/dashboard" : "/dashboard", request.url);

    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/assessment/:path*",
    "/history/:path*",
    "/result/:path*",
    "/login",
    "/register",
  ],
};
