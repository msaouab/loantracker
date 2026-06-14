import { auth } from "@/lib/auth";

/** Cheap edge gate only — no DB reads. Authoritative auth is getSession(). */
export const proxy = auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/loans/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/docs/:path*",
    "/auth/:path*",
  ],
};
