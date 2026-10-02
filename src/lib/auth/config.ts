// إعداد الدخول: إيميل/باسورد + Google — بلا Adapter (حساباتنا في User).
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { ensureGoogleUser, verifyCredentials } from "@/services/auth-accounts";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function authorizeLogin(credentials: unknown) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;
  return verifyCredentials(parsed.data.email, parsed.data.password);
}

const googleReady = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    ...(googleReady ? [Google] : []),
    Credentials({
      async authorize(credentials) {
        return authorizeLogin(credentials);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) (token as Record<string, unknown>).userId = user.id;
      return token;
    },
    async session({ session, token }) {
      const userId = (token as Record<string, unknown>).userId;
      if (typeof userId === "string") session.user.id = userId;
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        return ensureGoogleUser(user);
      }
      return true;
    },
    authorized({ auth: session, request }) {
      const publicPaths = ["/login", "/register", "/verify", "/forgot", "/reset"];
      if (publicPaths.some((p) => request.nextUrl.pathname.startsWith(p))) return true;
      return !!session?.user;
    },
  },
});
