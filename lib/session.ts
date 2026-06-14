import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getToken } from "next-auth/jwt";
import type { Session } from "next-auth";
import { getAuthSecret } from "@/lib/auth-secret";
import { getSessionCookieName } from "@/lib/auth-cookie";
import { prisma } from "@/lib/db";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";

async function readSessionToken() {
  const cookieName = getSessionCookieName();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cookieName);

  if (!sessionCookie?.value) {
    return null;
  }

  return getToken({
    req: {
      headers: {
        cookie: `${cookieName}=${sessionCookie.value}`,
      },
    },
    secret: getAuthSecret(),
    salt: cookieName,
  });
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
 * Re-validates the JWT bearer against the database once per request (React cache).
 * Returns null when the token is invalid, the user is gone, deactivated, frozen,
 * or their sessionVersion no longer matches (global revocation).
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

/** Server-side admin guard for RSC pages — redirects instead of throwing. */
export async function requireAdminOrRedirect(): Promise<string> {
  const session = await getSession();

  if (!session?.user.id) {
    redirect("/auth/login");
  }

  if (!session.user.isAdmin) {
    redirect("/dashboard");
  }

  return session.user.id;
}
