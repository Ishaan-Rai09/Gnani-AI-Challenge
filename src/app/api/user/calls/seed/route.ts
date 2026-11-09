import { NextResponse } from "next/server";
import { collections } from "@/lib/server/db";
import { currentUserId, unauthorized } from "@/lib/server/session";
import { buildSeedCalls } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Loads the sample calls into the signed-in user's history. */
export async function POST() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const seedCalls = buildSeedCalls();
  const now = new Date();

  // ordered:false keeps inserting when a sample call already exists.
  await (await collections.calls).insertMany(
    seedCalls.map((call) => ({
      _id: `${userId}:${call.id}`,
      userId,
      createdAt: now,
      startedAt: new Date(call.startedAt),
      riskLevel: call.riskLevel,
      action: call.action,
      number: call.number,
      data: call,
    })),
    { ordered: false }
  );

  return NextResponse.json({ ok: true, count: seedCalls.length });
}
