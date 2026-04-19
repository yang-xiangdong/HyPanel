import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;
const PUBLIC_METADATA_PATHS = new Set([
  "/favicon.ico",
  "/icon.svg",
  "/apple-icon.png",
  "/manifest.webmanifest",
]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const path = request.nextUrl.pathname;
  const isAdminHost = host.includes("admin");

  // Skip static assets and metadata files.
  if (
    path.startsWith("/_next") ||
    PUBLIC_FILE.test(path) ||
    PUBLIC_METADATA_PATHS.has(path)
  ) {
    return NextResponse.next();
  }

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
    // Match all routes except static files and Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest).*)",
  ],
};
