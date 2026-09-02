/**
 * Decodes a JWT's payload segment — no signature verification, since this is
 * only ever used to read claims (e.g. the current account id) off a token
 * this same test session already obtained from a real login, not to
 * authenticate anything itself.
 */
export function decodeJwtPayload<T>(token: string): T {
  const payload = token.split(".")[1];
  if (!payload) {
    throw new Error("decodeJwtPayload: token does not look like a JWT (no payload segment)");
  }
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(base64, "base64").toString("utf-8");
  return JSON.parse(json) as T;
}
