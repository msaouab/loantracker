import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { encode as defaultEncode } from "next-auth/jwt";
import {
  AccountNotActivatedError,
  AccountFrozenError,
  authenticateUser,
} from "@/lib/credentials";
import { ActivityActions } from "@/lib/activity-log";
import {
  buildAuthSummary,
  logActivitySafe,
} from "@/lib/activity-log-service";
import { getClientInfo } from "@/lib/client-info";
import { getAuthSecret } from "@/lib/auth-secret";
import {
  getSessionCookieName,
  REMEMBER_ME_MAX_AGE,
  SESSION_MAX_AGE,
} from "@/lib/auth-cookie";

class AccountNotActivated extends CredentialsSignin {
  code = "account_not_activated";
}

class AccountFrozen extends CredentialsSignin {
  code = "account_frozen";
}

function parseRememberMe(value: unknown): boolean {
  return value === true || value === "true" || value === "on";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const rememberMe = parseRememberMe(credentials.rememberMe);
        const clientInfo = getClientInfo(request);

        try {
          const user = await authenticateUser(email, password);
          if (!user) {
            return null;
          }

          await logActivitySafe({
            userId: user.id,
            action: ActivityActions.AUTH_LOGIN,
            summary: buildAuthSummary(ActivityActions.AUTH_LOGIN, clientInfo),
            entityType: "session",
            clientInfo,
          });

          return {
            ...user,
            rememberMe,
          };
        } catch (error) {
          if (error instanceof AccountNotActivatedError) {
            throw new AccountNotActivated();
          }
          if (error instanceof AccountFrozenError) {
            throw new AccountFrozen();
          }
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: REMEMBER_ME_MAX_AGE,
  },
  jwt: {
    maxAge: REMEMBER_ME_MAX_AGE,
    // Fixed-window: preserve token.exp on re-sign; only stamp a new expiry at login.
    encode: async (params) => {
      const token = params.token as { rememberMe?: boolean; exp?: number };
      const loginMaxAge =
        token.rememberMe === false ? SESSION_MAX_AGE : REMEMBER_ME_MAX_AGE;
      const nowSec = Math.floor(Date.now() / 1000);
      const existingExp =
        typeof token.exp === "number" ? token.exp : undefined;
      const maxAge =
        existingExp != null && existingExp > nowSec
          ? existingExp - nowSec
          : loginMaxAge;
      return defaultEncode({ ...params, maxAge });
    },
  },
  callbacks: {
    // Edge-only gate for proxy (no DB access). Authoritative checks live in getSession().
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/loans") ||
        nextUrl.pathname.startsWith("/admin") ||
        nextUrl.pathname.startsWith("/settings") ||
        nextUrl.pathname.startsWith("/docs");

      if (isProtected && !isLoggedIn) {
        return false;
      }

      // Optimistic admin check from stale JWT — getSession() enforces on the server.
      // /docs (API spec) is admin-only alongside /admin.
      if (
        isLoggedIn &&
        (nextUrl.pathname.startsWith("/admin") ||
          nextUrl.pathname.startsWith("/docs")) &&
        !session?.user?.isAdmin
      ) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (
        isLoggedIn &&
        session?.user?.isAdmin &&
        (nextUrl.pathname.startsWith("/loans") ||
          nextUrl.pathname === "/dashboard")
      ) {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }

      // Do not redirect away from /auth/* here — stale JWTs pass this edge check
      // while getSession() rejects them server-side, causing redirect loops.
      // Login/home pages redirect after DB-validated getSession() instead.

      return true;
    },
    // Edge-only: embed identity claims at login for proxy JWT decode. No DB reads.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rememberMe = user.rememberMe ?? true;
        token.isAdmin = user.isAdmin ?? false;
        token.sessionVersion = user.sessionVersion ?? 0;
      }
      return token;
    },
    // Edge-only: shape session for proxy. RSC/API routes use getSession() instead.
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin === true;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: getSessionCookieName(),
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure:
          process.env.NODE_ENV === "production" ||
          (process.env.NEXTAUTH_URL ?? "").startsWith("https://"),
      },
    },
  },
  secret: getAuthSecret(),
  trustHost: true,
});
