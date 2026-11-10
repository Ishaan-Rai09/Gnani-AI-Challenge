import { collections } from "@/lib/server/db";
import { forbiddenOrigin, isSameOrigin, jsonNoStore } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rateLimit";
import { currentUserId, unauthorized } from "@/lib/server/session";
import { buildSeedCalls } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Loads the sample calls into the signed-in user's history (idempotent). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return forbiddenOrigin();

  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const limit = rateLimit(`calls-seed:${userId}`, 10, 60_000);
  if (!limit.ok) {
    return jsonNoStore({ error: "RATE_LIMITED", retryAfter: limit.retryAfterSec }, 429);
  }

  const seedCalls = buildSeedCalls();
  const now = new Date();

  // Upserts keep repeated "load samples" presses idempotent and avoid the
  // duplicate-key error the previous insertMany could throw.
  await (await collections.calls).bulkWrite(
    seedCalls.map((call) => ({
      replaceOne: {
        filter: { _id: `${userId}:${call.id}` },
        replacement: {
          userId,
          createdAt: now,
          startedAt: new Date(call.startedAt),
          riskLevel: call.riskLevel,
          action: call.action,
          number: call.number,
          data: call,
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  return jsonNoStore({ ok: true, count: seedCalls.length });
}
