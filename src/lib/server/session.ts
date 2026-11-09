import { auth } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * Resolves the signed-in user's database id. Returns null for guests, whose
 * data stays in local storage exactly as before.
 */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
