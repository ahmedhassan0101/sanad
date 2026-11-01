// src/lib/auth/auth.config.ts
// in english: light secure setup for Edge environment (for middleware): no DB, no bcrypt, no node:crypto.
import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/register", "/verify", "/forgot", "/reset"];

// match at the segment level: "/verify" does not match "/verify-pending".
function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export default {
  providers: [], // no providers, because this is for edge middleware only.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request }) {
      if (isPublic(request.nextUrl.pathname)) return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
