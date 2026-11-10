"use client";

import { signOut } from "next-auth/react";

/**
 * Clears every Cache Storage entry on this device before ending the session.
 * The service worker also refuses to cache API/app responses, but dropping the
 * caches here guarantees no leftover per-user payload survives sign-out.
 */
export async function signOutAndClear(): Promise<void> {
  try {
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }
  } catch {
    // Cache Storage can be unavailable (private mode); sign-out still proceeds.
  }

  // Ask an active service worker to purge as well in case it holds extra state.
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_CACHES" });
  } catch {
    // Ignore postMessage failures.
  }

  await signOut({ callbackUrl: "/" });
}
