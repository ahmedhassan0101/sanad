// // middleware.ts
// import { auth } from "@/lib/auth/config";

// export default auth(function middleware() {});

// export const config = {
//   matcher: ["/dashboard/:path*", "/onboarding/:path*", "/platform/:path*"],


// --------------------------------
// src/middleware.ts
// بوابة خشنة: غير المسجّل يتحوّل لـ /login. الصلاحيات الحقيقية في الـ services.
// rough gateway: unlogged users are redirected to /login. real permissions are in the services.
import NextAuth from "next-auth";
import authConfig from "@/lib/auth/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/platform/:path*",
    "/select-org/:path*",
    "/verify-pending/:path*",
  ],
};