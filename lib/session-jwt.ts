import { getToken, type JWT } from "next-auth/jwt";
import { getAuthSecret } from "@/lib/auth-secret";
import { getSessionCookieName } from "@/lib/auth-cookie";

export type SessionJwt = JWT & {
  id?: string;
  sub?: string;
  sessionVersion?: number;
  isAdmin?: boolean;
  rememberMe?: boolean;
  exp?: number;
};

/**
 * Single JWT decode entry point for server-side session reads.
 * Edge/proxy continues to use Auth.js `auth()`; both must read the same
 * cookie name and secret. Update this module when upgrading next-auth.
 */
export async function decodeSessionJwt(
  cookieValue: string
): Promise<SessionJwt | null> {
  const cookieName = getSessionCookieName();

  const token = await getToken({
    req: {
      headers: {
        cookie: `${cookieName}=${cookieValue}`,
      },
    },
    secret: getAuthSecret(),
    salt: cookieName,
  });

  return (token as SessionJwt | null) ?? null;
}
