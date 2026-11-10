import { NextResponse } from "next/server";

/**
 * JSON response that must never be replayed from a shared cache or the
 * service worker — used for every per-user payload.
 */
export function jsonNoStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

/**
 * Rejects state-changing requests whose Origin header does not match the Host
 * serving the app. Session cookies are SameSite=Lax, so this is a second layer
 * against cross-site request forgery (and same-site subdomain attacks).
 *
 * Requests without an Origin header (curl, server-to-server) are allowed —
 * they cannot ride a victim's browser cookies.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === "null") return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function forbiddenOrigin(): NextResponse {
  return jsonNoStore({ error: "FORBIDDEN_ORIGIN" }, 403);
}
