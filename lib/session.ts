import { cache } from "react";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

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
 * Decodes the session via Auth.js `auth()` — the SAME decode path the edge
 * middleware uses — so the two can never disagree on whether a cookie is valid
 * (the previous manual `getToken` path could, causing "login doesn't stick").
 * On top of that decode it re-validates against the DB every request (React
 * `cache` dedupes within a request) so freeze/delete/revocation take effect live.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const decoded = await auth();
  if (!decoded?.user?.id) {
    return null;
  }
  const tokenUser = decoded.user;

  const user = await prisma.user.findUnique({
    where: { id: tokenUser.id },
    select: sessionUserSelect,
  });

  if (!user || !user.isActivated || user.isFrozen) {
    return null;
  }

  const tokenSessionVersion =
    typeof tokenUser.sessionVersion === "number" ? tokenUser.sessionVersion : 0;
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
    expires: decoded.expires,
  };
});

/**
 * Redirect to login. Does NOT mutate cookies — Server Components can't call
 * `cookies().set()` (Next throws). No loop results because the edge `authorized`
 * callback no longer redirects `/auth/*`, so a server-rejected session lands on
 * the login page and stays. `signOut()` handles real cookie clearing.
 */
export function redirectToLogin(): never {
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
