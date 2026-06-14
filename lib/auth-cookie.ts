export const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60;
export const SESSION_MAX_AGE = 24 * 60 * 60;

// Deterministic per environment (NOT derived from NEXTAUTH_URL): the cookie name
// must be identical for the writer (Auth.js), the edge reader (`auth()`), and the
// server reader (`getSession()`). Keying off NEXTAUTH_URL risked the name flipping
// (__Host- vs none) and the readers failing to find the cookie → auth loops.
export function shouldUseSecureCookies() {
  return process.env.NODE_ENV === "production";
}

/** Secure deployments use __Host- (stricter than __Secure-: Path=/, no Domain). */
export function getSessionCookieName() {
  const prefix = shouldUseSecureCookies() ? "__Host-" : "";
  return `${prefix}authjs.session-token`;
}
