import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  integer,
  boolean,
  numeric,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Steady — Personal Productivity OS
 *
 * One daily input, AI-categorized, locked once submitted.
 * The schema is intentionally relational so streaks, reviews and analytics
 * can all reference each other and be queried.
 */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  displayName: text("display_name"),
  timezone: text("timezone").notNull().default("UTC"),
  /** Day of week that is the designated rest day. 0 = Sunday .. 6 = Saturday. */
  restDay: integer("rest_day").notNull().default(0),
  /** Local hour (24h) after which a daily reminder email is sent. Default 20 (8pm). */
  reminderHour: integer("reminder_hour").notNull().default(20),
  emailOptIn: boolean("email_opt_in").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dailyEntries = pgTable(
  "daily_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Calendar day (in the user's timezone) this entry belongs to. */
    date: date("date", { mode: "string" }).notNull(),
    rawDescription: text("raw_description").notNull(),
    /** 'study' | 'skill' | 'health' | 'other' | 'uncategorized' */
    aiCategory: text("ai_category").notNull().default("uncategorized"),
    aiSummary: text("ai_summary"),
    /** 'locked' once submitted; never editable after. */
    status: text("status").notNull().default("locked"),
    /** Lightweight progress flag — the only field that can change after lock. */
    completed: boolean("completed").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    // Enforces one entry per user per day at the database level.
    unique("daily_entries_user_date_key").on(t.userId, t.date),
  ],
);

export const streaks = pgTable("streaks", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastShownUpDate: date("last_shown_up_date", { mode: "string" }),
});

export const weeklyReviews = pgTable("weekly_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** The Monday that starts this review's week. */
  weekStart: date("week_start", { mode: "string" }).notNull(),
  reflectionText: text("reflection_text"),
  completionRate: numeric("completion_rate", { precision: 5, scale: 4 }),
  restDayDate: date("rest_day_date", { mode: "string" }),
  /** Editable only until the end of that week, then locked. */
  locked: boolean("locked").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  // One review per user per week.
  unique("weekly_reviews_user_week_key").on(t.userId, t.weekStart),
]);

export const notificationsLog = pgTable("notifications_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** 'email' | 'in-app' */
  type: text("type").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  content: text("content"),
});

export const analyticsReports = pgTable("analytics_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** e.g. 'weekly', 'monthly' */
  period: text("period").notNull(),
  data: jsonb("data").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DailyEntry = typeof dailyEntries.$inferSelect;
export type Streak = typeof streaks.$inferSelect;
export type WeeklyReview = typeof weeklyReviews.$inferSelect;
