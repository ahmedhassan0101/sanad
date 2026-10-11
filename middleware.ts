import { auth } from "@/lib/auth/config";

export default auth(function middleware() {});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/platform/:path*"],
};
