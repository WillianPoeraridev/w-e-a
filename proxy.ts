import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge "proxy" (Next 16's renamed Middleware). Lightweight gate: bounce to
 * /login when no Better Auth session cookie is present. We read the cookie by
 * name (no better-auth import on the edge, so no jose/Node APIs leak into the
 * Edge runtime). Full validation happens server-side via getSession().
 */
const COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

export function proxy(request: NextRequest) {
  const hasSession = COOKIE_NAMES.some((name) => request.cookies.has(name));
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  // Protect everything except auth endpoints, the auth pages, PWA/static assets.
  matcher: [
    "/((?!api/auth|login|signup|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon-192.png|icon-512.png|apple-icon.png).*)",
  ],
};
