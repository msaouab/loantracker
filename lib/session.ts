import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import {
  getSessionCookieClearOptions,
  getSessionCookieName,
} from "@/lib/auth-cookie";
import { decodeSessionJwt } from "@/lib/session-jwt";
import { prisma } from "@/lib/db";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

async function readSessionToken() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(getSessionCookieName());

  if (!sessionCookie?.value) {
    return null;
  }

  return decodeSessionJwt(sessionCookie.value);
}

const sessionUserSelect = {
  id: true,
  email: true,
  fullName: true,
  isAdmin: true,
  isActivated: true,
  isFrozen: true,
  sessionVersion: true,
} as const;

/**
 * Authoritative session reader for RSC and API routes.
 *
 * Session architecture:
 * - Edge/proxy uses `auth()` from Auth.js for lightweight route gating.
 * - Server routes and RSC use `decodeSessionJwt()` via this module, with DB
 *   re-validation on every request (React `cache` dedupes within a request).
 *
 * Both paths must stay aligned on cookie name, secret, and JWT claims — see
 * `lib/session-jwt.ts` when upgrading next-auth.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = await readSessionToken();
  if (!token) {
    return null;
  }

  const userId = token.id ?? token.sub;
  if (typeof userId !== "string") {
    return null;
  }

  if (token.exp == null) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: sessionUserSelect,
  });

  if (!user || !user.isActivated || user.isFrozen) {
    return null;
  }

  const tokenSessionVersion =
    typeof token.sessionVersion === "number" ? token.sessionVersion : 0;
  if (user.sessionVersion !== tokenSessionVersion) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.fullName,
      isAdmin: user.isAdmin,
    },
    expires: new Date(Number(token.exp) * 1000).toISOString(),
  };
});

/** Drop a stale JWT so edge middleware stops treating the user as signed in. */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const name = getSessionCookieName();
  if (!cookieStore.get(name)) {
    return;
  }
  cookieStore.set(name, "", getSessionCookieClearOptions());
}

/** Redirect to login and clear any rejected session cookie to avoid auth redirect loops. */
export async function redirectToLogin(): Promise<never> {
  await clearSessionCookie();
  redirect("/auth/login");
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId();

  if (!userId) {
    throw new UnauthorizedError();
  }

  return userId;
}

export async function requireAdminUserId(): Promise<string> {
  const session = await getSession();

  if (!session?.user.id || !session.user.isAdmin) {
    throw new ForbiddenError();
  }

  return session.user.id;
}

/**
 * Manager-only API guard. Admins do not own loans/payments, so loan and payment
 * endpoints reject them with 403 — enforcing "admins have no portfolio" at the
 * API, not just hiding it in the UI.
 */
export async function requireManagerUserId(): Promise<string> {
  const session = await getSession();

  if (!session?.user.id) {
    throw new UnauthorizedError();
  }

  if (session.user.isAdmin) {
    throw new ForbiddenError();
  }

  return session.user.id;
}

/** Server-side admin guard for RSC pages — redirects instead of throwing. */
export async function requireAdminOrRedirect(): Promise<string> {
  const session = await getSession();

  if (!session?.user.id) {
    return redirectToLogin();
  }

  if (!session.user.isAdmin) {
    redirect("/dashboard");
  }

  return session.user.id;
}

/** Keep loan portfolio pages manager-only. */
export async function requireManagerOrRedirect(): Promise<string> {
  const session = await getSession();

  if (!session?.user.id) {
    return redirectToLogin();
  }

  if (session.user.isAdmin) {
    redirect("/admin/dashboard");
  }

  return session.user.id;
}
