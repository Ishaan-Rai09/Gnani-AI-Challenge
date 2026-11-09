import { NextResponse } from "next/server";
import { collections } from "@/lib/server/db";
import { currentUserId, unauthorized } from "@/lib/server/session";
import type { CallRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Saves one finalized screening record to the signed-in user's history. */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  let record: CallRecord;
  try {
    record = (await request.json()) as CallRecord;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (!record?.id || !record?.number || !Array.isArray(record.transcript)) {
    return NextResponse.json({ error: "INVALID_RECORD" }, { status: 400 });
  }

  const calls = await collections.calls;
  const row = {
    _id: `${userId}:${record.id}`,
    userId,
    createdAt: new Date(),
    startedAt: new Date(record.startedAt),
    riskLevel: record.riskLevel,
    action: record.action,
    number: record.number,
    data: record,
  };

  await calls.replaceOne({ _id: row._id }, row, { upsert: true });

  return NextResponse.json({ ok: true });
}

/** Clears the signed-in user's entire call history. */
export async function DELETE() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  (await collections.calls).deleteMany({ userId });
  return NextResponse.json({ ok: true });
}
