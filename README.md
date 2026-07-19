# Steady — Personal Productivity OS

Steady is a calm, single-user personal productivity system built around one idea:
**one thing a day, locked in.** Each day you write a single short intention via a
floating action button (FAB); it is AI-categorized (study / skill / health / other),
given a short summary, and then **locked** — it can never be edited again, only marked
as done. Showing up builds a streak (with a weekly rest day that never breaks it),
each week can be reflected on in a locked-when-over weekly review, and optional email
reminders and weekly summaries keep the rhythm going.

It is designed for a single person's own use (identity is a lightweight cookie, no
password), but the schema stays multi-user capable. The tone throughout is deliberately
gentle: consistency over intensity, and the user's input is never lost to an AI failure.

## Tech stack

Versions are taken directly from `package.json`.

| Layer | Tech | Version |
|-------|------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| UI | React / React DOM | 19.2.6 |
| Language | TypeScript | 5.9.3 |
| ORM | Drizzle ORM | 0.45.2 |
| DB driver | `pg` (node-postgres) | 8.20.0 |
| Migrations/tooling | drizzle-kit | 0.31.10 |
| Styling | Tailwind CSS + `@tailwindcss/postcss` | 4.1.17 |
| Env loading | dotenv | 17.3.1 |
| Lint | ESLint + eslint-config-next | 9.39.4 / 16.2.6 |

Database is plain PostgreSQL accessed through the standard `pg` `Pool` — any Postgres
host works (a local instance, Neon, Supabase, etc.). AI categorization uses the
OpenRouter chat completions API; email uses Resend. Both are optional and degrade
gracefully when their keys are absent.

## Features

Confirmed against the actual route handlers and pages:

- **One daily entry via a FAB** — write one intention; it is categorized and locked on
  save. One entry per user per day, enforced both by an explicit check and a DB unique
  constraint (`POST /api/entries`).
- **AI categorization with a local fallback** — OpenRouter categorizes the text into
  `study` / `skill` / `health` / `other`; on any failure (no key, timeout, bad JSON) a
  dependency-free keyword categorizer takes over so the entry is never blocked.
- **Locked entries** — content is immutable after save; the only field that can change
  is the lightweight `completed` flag (`PATCH /api/entries/today`).
- **Streaks with a rest day** — the streak advances each day you show up; your chosen
  rest day never breaks it, and any genuinely missed non-rest day resets it. Framing is
  always calm (`fresh` / `today` / `pending` / `broken`).
- **History view** — a category heatmap (up to 53 weeks) plus a reverse-chronological
  list of every entry.
- **Weekly reviews** — per-week day-by-day breakdown, honest completion rate (rest day
  excluded), an auto-generated draft, and an editable reflection that locks once the
  week is over (`PUT /api/reviews`).
- **Email notifications** — a daily reminder (if you haven't logged by your reminder
  hour) and a Monday weekly summary, both via Resend, both de-duplicated via a
  notifications log.
- **Settings** — email, display name, timezone, rest day, reminder hour, and email
  opt-in (`PUT /api/user`).
- **Cookie-based identity** — no password; a single `steady_uid` cookie links the
  device to the user (`POST /api/auth/setup`, `POST /api/auth/logout`).
- **Health check** — `GET /api/health` runs `select 1`.

> Analytics reports are written to the database from day one but there is **no analytics
> UI** yet — see [Known limitations](#known-limitations--v2-roadmap).

## Project structure

```
.
├── src/
│   ├── app/                 # Next.js App Router: pages + API routes
│   │   ├── api/             # Route handlers (auth, entries, reviews, user, health, cron)
│   │   ├── history/         # /history page
│   │   ├── review/          # /review page
│   │   ├── settings/        # /settings page
│   │   ├── page.tsx         # / — Today (or the setup/Welcome screen if no user)
│   │   └── layout.tsx       # Root layout, fonts, metadata
│   ├── components/          # Client + server UI (Fab, TodayCard, Heatmap, forms, nav…)
│   ├── db/                  # Drizzle: schema.ts (tables) + index.ts (pool/db client)
│   └── lib/                 # Core logic (see below)
├── drizzle.config.json      # Drizzle Kit config (dialect, schema path, db url)
├── vercel.json              # Vercel cron schedules
├── next.config.ts
└── .env.example             # Every env var referenced in code (no secrets)
```

Core logic in `src/lib/`:

- `categorize.ts` — local keyword categorizer + LLM-JSON parser + summarizer (the
  graceful fallback).
- `openrouter.ts` — server-side OpenRouter call; returns `null` on any failure.
- `categories.ts` — the category enum and display metadata (labels, colors, emoji).
- `streaks.ts` — streak recomputation and display state, honoring the rest day.
- `queries.ts` — all Drizzle queries + week-stats / review-draft builders.
- `session.ts` — cookie-based current-user resolution.
- `notify.ts` — write/read the notifications log (for de-duplication).
- `email.ts` — Resend sender + shared email HTML layout.
- `time.ts` — timezone-aware calendar-day math (`YYYY-MM-DD` strings).
- `validation.ts` / `constants.ts` — input sanitizing and static option lists.

## Database schema

Defined in `src/db/schema.ts` (PostgreSQL, Drizzle). All child tables reference
`users.id` with `on delete cascade`.

- **`users`** — `id` (uuid, pk), `email` (unique, not null), `display_name`,
  `timezone` (default `UTC`), `rest_day` (0–6, default 0 = Sunday), `reminder_hour`
  (0–23, default 20), `email_opt_in` (default true), `created_at`.
- **`daily_entries`** — `id` (uuid, pk), `user_id` → users, `date` (calendar day in the
  user's tz), `raw_description`, `ai_category` (default `uncategorized`), `ai_summary`,
  `status` (default `locked`), `completed` (default false), `created_at`.
  **Unique `(user_id, date)`** — one entry per user per day.
- **`streaks`** — `user_id` (pk → users, one row per user), `current_streak`,
  `longest_streak`, `last_shown_up_date`.
- **`weekly_reviews`** — `id` (uuid, pk), `user_id` → users, `week_start` (the Monday),
  `reflection_text`, `completion_rate` (numeric 5,4), `rest_day_date`, `locked`
  (default false), `created_at`, `updated_at`. **Unique `(user_id, week_start)`** — one
  review per user per week.
- **`notifications_log`** — `id` (uuid, pk), `user_id` → users, `type`
  (`email:*` / `in-app`), `sent_at`, `content`. Used to de-duplicate reminders.
- **`analytics_reports`** — `id` (uuid, pk), `user_id` → users, `period`
  (e.g. `weekly`), `data` (jsonb), `sent_at`. Written but not yet surfaced in any UI.

## Getting started

Prerequisites: Node.js (with npm) and a PostgreSQL database.

```bash
# 1. Clone
git clone <your-repo-url>
cd personal-productivity-os-development

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# then edit .env.local — at minimum set DATABASE_URL
```

At minimum you need `DATABASE_URL`. `OPENROUTER_API_KEY`, `RESEND_API_KEY`, and
`CRON_SECRET` are optional for local development — without them AI categorization and
email fall back to local/no-op behavior, and the cron routes will reject requests.

### Database migrations

Migrations use **Drizzle Kit**, configured in `drizzle.config.json` (dialect
`postgresql`, schema `./src/db/schema.ts`). Note the `dbCredentials.url` there points at
a local database (`postgresql://postgres:postgres@127.0.0.1:5432/app_db`); edit it or
rely on your environment to match your actual database.

There is no dedicated npm script for migrations, so invoke Drizzle Kit directly:

```bash
# Push the schema straight to the database (simplest for a personal/local DB)
npx drizzle-kit push

# Or generate SQL migration files and apply them
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Run the dev server

```bash
npm run dev      # start Next.js dev server (http://localhost:3000)
```

Other scripts (from `package.json`):

```bash
npm run build      # production build
npm run start      # run the production build
npm run lint       # eslint .
npm run typecheck  # tsc --noEmit
```

## Environment variables

Every variable below is referenced in the code (`grep process.env`). `NODE_ENV` is
managed by the framework and is not listed. See `.env.example` for a copy-paste template.

| Variable | Required | Purpose | Where to get it |
|----------|----------|---------|-----------------|
| `DATABASE_URL` | Yes | Postgres connection string used by the `pg` pool. | Your Postgres host — e.g. a Neon connection string, or a local `postgresql://…` URL. |
| `OPENROUTER_API_KEY` | No | Enables AI categorization; if unset, the local keyword categorizer is used. | [openrouter.ai](https://openrouter.ai) → API keys. |
| `OPENROUTER_MODEL` | No | Model slug for categorization. Defaults to `tencent/hy3:free`. | An OpenRouter model slug. |
| `OPENROUTER_REFERER` | No | Sent as `HTTP-Referer` to OpenRouter. Defaults to `https://steady.app`. | Your app URL. |
| `RESEND_API_KEY` | No | Enables outgoing email; if unset, sending is a no-op (still logged). | [resend.com](https://resend.com) → API keys. |
| `EMAIL_FROM` | No | From address for email. Defaults to `Steady <steady@resend.dev>`. | A Resend-verified sender. |
| `CRON_SECRET` | Yes (for cron routes) | Bearer token the cron routes require; without it they return 401. | A secret you generate and set on Vercel. |
| `NEXT_PUBLIC_APP_URL` | No | Absolute URL used in email links. Defaults to `https://steady.app`. | Your deployed app URL. |

## Deployment

The app is a standard Next.js App Router project and deploys to **Vercel**.

`vercel.json` configures two cron jobs:

| Path | Schedule | What it does |
|------|----------|--------------|
| `/api/cron/daily-reminder` | `*/15 * * * *` (every 15 min) | For each opted-in user whose local time is past their reminder hour and who hasn't logged today, sends a reminder email (de-duplicated via the notifications log). |
| `/api/cron/weekly-summary` | `0 9 * * 1` (Mondays 09:00) | Summarizes the just-finished week per user: writes an analytics report and, if opted in, sends a summary email. |

Both cron routes are protected by `CRON_SECRET` — they reject any request whose
`Authorization` header is not `Bearer <CRON_SECRET>`. Set `CRON_SECRET` (and the other
env vars you use) in the Vercel project settings. The reminder cron runs every 15
minutes so it can catch each user's reminder hour in their own timezone.

## Known limitations / v2 roadmap

Based on what is (and isn't) actually in the code:

- **Analytics UI is not built.** The `analytics_reports` table exists and reports are
  written on every weekly review (`PUT /api/reviews`) and by the weekly-summary cron,
  but nothing reads them back — there is no analytics page or read endpoint. This is the
  clearest "data model now, UI later" item.
- **Cron handlers are `POST`, Vercel Cron issues `GET`.** The two files under
  `src/app/api/cron/` export only a `POST` handler, while Vercel Cron Jobs invoke their
  paths with `GET`. As configured, the scheduled invocations won't match the handler
  until a `GET` export is added (or the invocation method is changed). Worth verifying
  before relying on the crons in production.
- **Single-user by design.** Identity is a single unsigned `steady_uid` cookie holding
  the user id — no password, no real auth. The schema is multi-user capable, but there
  is no login/registration flow beyond the cookie-setting setup route.
- **`notifications_log.type` supports `in-app`, but only email is sent.** The log
  distinguishes `email` vs `in-app` notifications; in practice only `email:daily-reminder`
  and `email:weekly-summary` are ever written — there is no in-app notification surface.
- **`drizzle.config.json` hardcodes a local DB URL** and there is no npm script for
  migrations; run `drizzle-kit` directly and point it at your real database.
