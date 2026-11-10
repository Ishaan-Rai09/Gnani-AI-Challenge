import { collections } from "@/lib/server/db";
import { forbiddenOrigin, isSameOrigin, jsonNoStore } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { currentUserId, unauthorized } from "@/lib/server/session";
import { sanitizeCallRecord } from "@/lib/server/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 512 * 1024;
const MAX_CALLS_PER_USER = 5_000;

/** Saves one finalized screening record to the signed-in user's history. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const limit = rateLimit(`call-save:${userId}`, 60, 60_000);
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

  const record = sanitizeCallRecord(payload);
  if (!record) {
    return jsonNoStore({ error: "INVALID_RECORD" }, 400);
  }

  const calls = await collections.calls;
  const rowId = `${userId}:${record.id}`;
  const existing = await calls.findOne({ _id: rowId }, { projection: { _id: 1 } });
  if (!existing && (await calls.countDocuments({ userId })) >= MAX_CALLS_PER_USER) {
    return jsonNoStore({ error: "HISTORY_FULL", max: MAX_CALLS_PER_USER }, 409);
  }

  const row = {
    userId,
    createdAt: new Date(),
    startedAt: new Date(record.startedAt),
    riskLevel: record.riskLevel,
    action: record.action,
    number: record.number,
    data: record,
  };

  await calls.replaceOne({ _id: rowId }, row, { upsert: true });

  return jsonNoStore({ ok: true });
}

/** Clears the signed-in user's entire call history. */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const limit = rateLimit(`call-clear:${userId}`, 10, 60_000);
  if (!limit.ok) {
    return jsonNoStore({ error: "RATE_LIMITED", retryAfter: limit.retryAfterSec }, 429);
  }

  await (await collections.calls).deleteMany({ userId });
  return jsonNoStore({ ok: true });
}
