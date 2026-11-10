import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { mongoConfigured, collections } from "@/lib/server/db";

/**
 * Google sign-in. Signed-in users get server-persisted, per-user call history
 * and blocklist; without credentials the provider list is empty.
 */

const AUTH_SECRET = process.env.AUTH_SECRET?.trim();

// Never fall back to a published secret in production: a known signing key
// lets anyone mint a valid session cookie and impersonate any account.
if (!AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error(
    "AUTH_SECRET is required in production. Generate one with `npx auth secret` and set it in the deployment environment."
  );
}

export const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim() &&
    mongoConfigured
);

async function upsertGoogleUser(input: {
  googleSub: string;
  email: string;
  name: string | null;
  image: string | null;
}): Promise<string | null> {
  try {
    const users = await collections.users;
    const now = new Date();
    const result = await users.findOneAndUpdate(
      { email: input.email },
      {
        $set: { name: input.name, image: input.image, googleSub: input.googleSub },
        $setOnInsert: { email: input.email, createdAt: now },
      },
      { upsert: true, returnDocument: "after" }
    );
    return result?._id ? String(result._id) : null;
  } catch (error) {
    if (error instanceof Error && error.message.includes("E11000")) {
      // Parallel sign-ins can race the unique-email upsert; read instead.
      const users = await collections.users;
      const user = await users.findOne({ email: input.email });
      return user?._id ? String(user._id) : null;
    }
    throw error;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Only trust forwarded Host headers where the platform guarantees them. On
  // Vercel they are fixed; elsewhere require AUTH_TRUST_HOST=true explicitly.
  trustHost:
    process.env.NODE_ENV !== "production" ||
    Boolean(process.env.VERCEL) ||
    process.env.AUTH_TRUST_HOST === "true",
  secret: AUTH_SECRET || "callshield-local-dev-only-secret",
  // Credentials are passed explicitly: the bare `Google` provider only
  // auto-reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET, not GOOGLE_CLIENT_ID.
  providers: googleConfigured
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      // Never create or link an account from an unverified or missing email.
      if (!user.email) return false;
      if ((profile as { email_verified?: boolean } | undefined)?.email_verified === false) {
        return false;
      }
      const userId = await upsertGoogleUser({
        googleSub: account.providerAccountId,
        email: user.email,
        name: user.name ?? null,
        image: user.image ?? null,
      });
      if (userId && (user as { id?: string }).id) {
        (user as { id: string }).id = userId;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // `user.id` (set by the signIn callback from the Mongo upsert) is the
      // reliable source — token.email is not yet populated on first sign-in.
      if (account?.provider === "google" && user?.id) {
        token.uid = String(user.id);
      } else if (account?.provider === "google" && token.email) {
        const users = await collections.users;
        const dbUser = await users.findOne({ email: token.email });
        if (dbUser) token.uid = String(dbUser._id);
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) {
        session.user.id = String(token.uid);
      }
      return session;
    },
  },
});
