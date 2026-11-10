import { collections } from "@/lib/server/db";
import { forbiddenOrigin, isSameOrigin, jsonNoStore } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { currentUserId, unauthorized } from "@/lib/server/session";
import { digitsOf, sanitizeBlockedNumber } from "@/lib/server/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_BLOCKED_ENTRIES = 5_000;
const MAX_BODY_BYTES = 32 * 1024;

/** Adds a blocked number for the signed-in user. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const limit = rateLimit(`block-add:${userId}`, 60, 60_000);
  if (!limit.ok) {
    return jsonNoStore({ error: "RATE_LIMITED", retryAfter: limit.retryAfterSec }, 429);
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return jsonNoStore({ error: "PAYLOAD_TOO_LARGE" }, 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonNoStore({ error: "INVALID_JSON" }, 400);
  }

  const entry = sanitizeBlockedNumber(payload);
  if (!entry) {
    return jsonNoStore({ error: "INVALID_NUMBER" }, 400);
  }

  const blocked = await collections.blocked;
  if ((await blocked.countDocuments({ userId })) >= MAX_BLOCKED_ENTRIES) {
    return jsonNoStore({ error: "BLOCKLIST_FULL", max: MAX_BLOCKED_ENTRIES }, 409);
  }
  // Compare digit-normalized numbers so "+91 98765 43210" and "+919876543210"
  // are treated as the same entry.
  const existing = await blocked.find({ userId }).project({ number: 1 }).toArray();
  if (existing.some((row) => digitsOf(row.number) === digitsOf(entry.number))) {
    return jsonNoStore({ ok: true, duplicate: true });
  }

  await blocked.replaceOne(
    { _id: `${userId}:${entry.id}` },
    {
      userId,
      createdAt: new Date(),
      number: entry.number,
      data: entry,
    },
    { upsert: true }
  );

  return jsonNoStore({ ok: true });
}

/** Removes one blocked number (?id=) for the signed-in user. */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const limit = rateLimit(`block-remove:${userId}`, 60, 60_000);
  if (!limit.ok) {
    return jsonNoStore({ error: "RATE_LIMITED", retryAfter: limit.retryAfterSec }, 429);
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !ID_RE.test(id)) {
    return jsonNoStore({ error: "INVALID_ID" }, 400);
  }

  // Client sends the raw entry id; rows are stored namespaced per user. The
  // userId filter double-guards against touching another account's rows.
  await (await collections.blocked).deleteMany({ userId, _id: `${userId}:${id}` });
  return jsonNoStore({ ok: true });
}
