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
  shouldUseSecureCookies,
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
    // Edge-only optimistic gate (no DB). The ONLY redirect here is
    // "not signed in → login page", which the server always agrees with.
    //
    // Loop-prevention invariant: the edge must NOT make any redirect the server
    // could contradict. So NO role redirects and NO /auth redirects here — those
    // depend on DB truth (isAdmin/isFrozen/sessionVersion) the edge can't see.
    // All role/redirect enforcement lives server-side in getSession() +
    // requireAdminOrRedirect()/requireManagerOrRedirect(), a single source of
    // truth that cannot loop against itself.
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
        session.user.sessionVersion =
          typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
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
        secure: shouldUseSecureCookies(),
      },
    },
  },
  secret: getAuthSecret(),
  trustHost: true,
});
