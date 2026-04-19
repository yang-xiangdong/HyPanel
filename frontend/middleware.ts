import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const path = request.nextUrl.pathname;
  const isAdminHost = host.includes("admin");

  // Admin domain: block user routes
  if (isAdminHost && !path.startsWith("/admin") && path !== "/") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // User domain: block admin routes
  if (!isAdminHost && path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
