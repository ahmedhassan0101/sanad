// src\lib\auth\config.ts
// full login setup (Node): email/password + Google — no Adapter (our accounts are in User).
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import {
  ensureGoogleUser,
  getSessionVersionByUserId,
  resolveGoogleTokenUser,
  verifyCredentials,
} from "@/services/auth-accounts";
import authConfig from "./auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      sessionVersion: number | null;
    } & DefaultSession["user"];
  }
}

/** TODO: use the  common schema instead of duplicating */
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function authorizeLogin(credentials: unknown) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;
  return verifyCredentials(parsed.data.email, parsed.data.password);
}

const googleReady =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // session + pages + authorized (المشتركة مع الـ middleware)
  providers: [
    ...(googleReady
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      async authorize(credentials) {
        return authorizeLogin(credentials);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (user?.id) {
        if (account?.provider === "google" && user.email) {
          const resolved = await resolveGoogleTokenUser(user.email);
          if (resolved) {
            (token as Record<string, unknown>).userId = resolved.id;
            (token as Record<string, unknown>).sessionVersion =
              resolved.sessionVersion;
          }
        } else {
          // Credentials ترجع Mongo _id مباشرة.
          (token as Record<string, unknown>).userId = user.id;
          const v = (user as { sessionVersion?: unknown }).sessionVersion;
          (token as Record<string, unknown>).sessionVersion =
            typeof v === "number"
              ? v
              : await getSessionVersionByUserId(user.id);
        }
      }
      return token;
    },
    async session({ session, token }) {
      const userId = (token as Record<string, unknown>).userId;
      if (typeof userId === "string") session.user.id = userId;
      const sv = (token as Record<string, unknown>).sessionVersion;
      session.user.sessionVersion = typeof sv === "number" ? sv : null;
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        return ensureGoogleUser(user);
      }
      return true;
    },
  },
});
// import NextAuth, { type DefaultSession } from "next-auth";
// import Credentials from "next-auth/providers/credentials";
// import Google from "next-auth/providers/google";
// import { z } from "zod";
// import {
//   ensureGoogleUser,
//   getSessionVersionByUserId,
//   resolveGoogleTokenUser,
//   verifyCredentials,
// } from "@/services/auth-accounts";

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//       sessionVersion: number | null;
//     } & DefaultSession["user"];
//   }
// }

// /** TODO: use the  common schema instead of duplicating */
// const credentialsSchema = z.object({
//   email: z.string().email(),
//   password: z.string().min(1),
// });

// async function authorizeLogin(credentials: unknown) {
//   const parsed = credentialsSchema.safeParse(credentials);
//   if (!parsed.success) return null;
//   return verifyCredentials(parsed.data.email, parsed.data.password);
// }

// const googleReady =
//   !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   session: { strategy: "jwt" },
//   pages: { signIn: "/login" },
//   providers: [
//     ...(googleReady
//       ? [
//           Google({
//             clientId: process.env.GOOGLE_CLIENT_ID,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//           }),
//         ]
//       : []),
//     Credentials({
//       async authorize(credentials) {
//         return authorizeLogin(credentials);
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user, account }) {
//       if (user?.id) {
//         if (account?.provider === "google" && user.email) {
//           const resolved = await resolveGoogleTokenUser(user.email);
//           if (resolved) {
//             (token as Record<string, unknown>).userId = resolved.id;
//             (token as Record<string, unknown>).sessionVersion =
//               resolved.sessionVersion;
//           }
//         } else {
//           // Credentials ترجع Mongo _id مباشرة.
//           (token as Record<string, unknown>).userId = user.id;
//           const v = (user as { sessionVersion?: unknown }).sessionVersion;
//           (token as Record<string, unknown>).sessionVersion =
//             typeof v === "number"
//               ? v
//               : await getSessionVersionByUserId(user.id);
//         }
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       const userId = (token as Record<string, unknown>).userId;
//       if (typeof userId === "string") session.user.id = userId;
//       const sv = (token as Record<string, unknown>).sessionVersion;
//       session.user.sessionVersion = typeof sv === "number" ? sv : null;
//       return session;
//     },
//     async signIn({ user, account }) {
//       if (account?.provider === "google") {
//         return ensureGoogleUser(user);
//       }
//       return true;
//     },
//     authorized({ auth: session, request }) {
//       const publicPaths = [
//         "/login",
//         "/register",
//         "/verify",
//         "/forgot",
//         "/reset",
//       ];
//       if (publicPaths.some((p) => request.nextUrl.pathname.startsWith(p)))
//         return true;
//       return !!session?.user;
//     },
//   },
// });
