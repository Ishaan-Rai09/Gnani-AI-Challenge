import { NextResponse } from "next/server";
import { collections } from "@/lib/server/db";
import { currentUserId, unauthorized } from "@/lib/server/session";
import type { BlockedNumber } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeNumber(value: string) {
  return value.replace(/[^\d+]/g, "");
}

/** Adds a blocked number for the signed-in user. */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  let entry: BlockedNumber;
  try {
    entry = (await request.json()) as BlockedNumber;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (!entry?.number || normalizeNumber(entry.number).length < 6) {
    return NextResponse.json({ error: "INVALID_NUMBER" }, { status: 400 });
  }

  const blocked = await collections.blocked;
  const existing = await blocked.findOne({ userId, number: entry.number });
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await blocked.insertOne({
    _id: `${userId}:${entry.id}`,
    userId,
    createdAt: new Date(),
    number: entry.number,
    data: entry,
  });

  return NextResponse.json({ ok: true });
}

/** Removes one blocked number (?id=) for the signed-in user. */
export async function DELETE(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });

  // Client sends the raw entry id; rows are stored namespaced per user. The
  // userId filter double-guards against touching another account's rows.
  await (await collections.blocked).deleteMany({ userId, _id: `${userId}:${id}` });
  return NextResponse.json({ ok: true });
}
