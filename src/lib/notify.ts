import { db } from "@/db";
import { notificationsLog } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";

export async function logNotification(
  userId: string,
  type: string,
  content: string,
) {
  await db.insert(notificationsLog).values({ userId, type, content });
}

/** Has this exact notification type been sent to the user since `since`? */
export async function notifiedSince(
  userId: string,
  type: string,
  since: Date,
): Promise<boolean> {
  const [row] = await db
    .select({ id: notificationsLog.id })
    .from(notificationsLog)
    .where(
      and(
        eq(notificationsLog.userId, userId),
        eq(notificationsLog.type, type),
        gte(notificationsLog.sentAt, since),
      ),
    )
    .limit(1);
  return Boolean(row);
}
