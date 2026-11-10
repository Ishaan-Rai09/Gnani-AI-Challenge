import { collections } from "@/lib/server/db";
import { forbiddenOrigin, isSameOrigin, jsonNoStore } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { currentUserId, unauthorized } from "@/lib/server/session";
import { sanitizeBlockedNumber, sanitizeCallRecord } from "@/lib/server/validate";
import { buildSeedBlocklist, buildSeedCalls } from "@/lib/seed";
import type { BlockedNumber, CallRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS = 1_000;

/**
 * Full per-user snapshot: the signed-in user's call history and blocklist.
 * Unauthenticated callers receive a 401.
 */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const [callRows, blockedRows] = await Promise.all([
    (await collections.calls)
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(MAX_ROWS)
      .toArray(),
    (await collections.blocked)
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(MAX_ROWS)
      .toArray(),
  ]);

  // Re-validate on read too: rows written before validation existed (or by a
  // buggy client) never reach the UI unchecked.
  const calls: CallRecord[] = callRows
    .map((row) => sanitizeCallRecord(row.data))
    .filter((record): record is CallRecord => record !== null);

  const blocklist: BlockedNumber[] = blockedRows
    .map((row) => {
      const stored = (row.data ?? {}) as Partial<BlockedNumber>;
      return sanitizeBlockedNumber({
        ...stored,
        // Row ids are stored as `${userId}:${entry.id}`; hand back the raw id.
        id: stored.id ?? String(row._id).split(":").slice(1).join(":"),
        number: row.number,
        blockedAt: stored.blockedAt ?? row.createdAt.toISOString(),
      });
    })
    .filter((entry): entry is BlockedNumber => entry !== null);

  return jsonNoStore({ authenticated: true, calls, blocklist });
}

/** Replaces the user's data with the seeded demo set (used by Reset). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const limit = rateLimit(`state-reset:${userId}`, 6, 60_000);
  if (!limit.ok) {
    return jsonNoStore({ error: "RATE_LIMITED", retryAfter: limit.retryAfterSec }, 429);
  }

  const seedCalls = buildSeedCalls();
  const seedBlocked = buildSeedBlocklist();
  const now = new Date();

  const calls = await collections.calls;
  const blocked = await collections.blocked;

  await Promise.all([
    calls.deleteMany({ userId }),
    blocked.deleteMany({ userId }),
  ]);

  await Promise.all([
    calls.insertMany(
      seedCalls.map((call) => ({
        _id: `${userId}:${call.id}`,
        userId,
        createdAt: now,
        startedAt: new Date(call.startedAt),
        riskLevel: call.riskLevel,
        action: call.action,
        number: call.number,
        data: call,
      }))
    ),
    blocked.insertMany(
      seedBlocked.map((entry) => ({
        _id: `${userId}:${entry.id}`,
        userId,
        createdAt: now,
        number: entry.number,
        data: entry,
      }))
    ),
  ]);

  return jsonNoStore({ ok: true });
}
