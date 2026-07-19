import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/db/schema";

export const USER_COOKIE = "steady_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Identity is intentionally lightweight: a single signed-by-presence cookie
 * holds the user's id. There's one personal user here, but the schema stays
 * multi-user capable. All data is scoped to this user.
 */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const id = store.get(USER_COOKIE)?.value;
  if (!id) return null;
  try {
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return u ?? null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(USER_COOKIE, "", { maxAge: 0, path: "/" });
}
