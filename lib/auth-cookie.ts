export const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60;
export const SESSION_MAX_AGE = 24 * 60 * 60;

export function shouldUseSecureCookies() {
  return (
    process.env.NODE_ENV === "production" ||
    (process.env.NEXTAUTH_URL ?? "").startsWith("https://")
  );
}

/** Secure deployments use __Host- (stricter than __Secure-: Path=/, no Domain). */
export function getSessionCookieName() {
  const prefix = shouldUseSecureCookies() ? "__Host-" : "";
  return `${prefix}authjs.session-token`;
}

/** Cookie options must match Auth.js session token settings when clearing. */
export function getSessionCookieClearOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: shouldUseSecureCookies(),
    maxAge: 0,
  };
}
