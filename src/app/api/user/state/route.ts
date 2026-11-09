import { NextResponse } from "next/server";
import { collections } from "@/lib/server/db";
import { currentUserId, unauthorized } from "@/lib/server/session";
import { buildSeedBlocklist, buildSeedCalls } from "@/lib/seed";
import type { BlockedNumber, CallRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Full per-user snapshot: the signed-in user's call history and blocklist.
 * Guests receive a 401 so the store can fall back to local-storage demo data.
 */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const [callRows, blockedRows] = await Promise.all([
    (await collections.calls)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray(),
    (await collections.blocked)
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray(),
  ]);

  const calls: CallRecord[] = callRows.map((row) => row.data as CallRecord);
  const blocklist: BlockedNumber[] = blockedRows.map((row) => {
    const stored = row.data as Partial<BlockedNumber> | null;
    return {
      // Row ids are stored as `${userId}:${entry.id}`; hand back the raw id.
      id: stored?.id ?? String(row._id).split(":").slice(1).join(":"),
      number: row.number,
      label: stored?.label ?? "Blocked number",
      reason: stored?.reason ?? "Blocked.",
      source: stored?.source ?? "call",
      blockedAt: stored?.blockedAt ?? row.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ authenticated: true, calls, blocklist });
}

/** Replaces the user's data with the seeded demo set (used by Reset). */
export async function POST() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

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

  return NextResponse.json({ ok: true });
}
