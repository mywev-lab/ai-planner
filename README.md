# AI Planner — Executive Assistant

An AI executive assistant that **proactively** organizes your time. It chats
naturally, schedules and reschedules Google Calendar events, turns to‑do lists
into time blocks, and produces a daily/weekly briefing — powered by OpenAI
(reasoning + tool calling) and the Google Calendar API.

> Single‑user build. Everything runs server‑side in Next.js API routes, so your
> OpenAI key and Google tokens never reach the browser.

## Features

- **Chat → schedule** — "Schedule lunch with John tomorrow at 1 PM."
- **Smart task planner** — the AI estimates duration and finds the best slots.
- **Task → time‑blocking** — turns a to‑do list into calendar blocks by
  priority, deadline, estimate, existing events, and focus time.
- **Smart rescheduling** — proposes an optimized plan, not a blind move.
- **Daily & weekly briefing** — priorities, meetings, focus blocks, tasks at
  risk, and a productivity tip, on the dashboard.
- **Natural chat assistant** — "Organize my week", "Do I have time to study
  tomorrow?", "Move my workout to Thursday".

## Architecture

```
src/
  app/
    page.tsx                 Dashboard (briefing, agenda, tasks, chat)
    api/
      chat/                  OpenAI tool-calling agent
      briefing/              Daily/weekly briefing generator
      tasks/                 Task CRUD (Supabase)
      calendar/events/       Read calendar
      auth/google/           OAuth connect + callback
      status/                Integration status for the UI
  lib/
    openai.ts                Server-only OpenAI client
    config.ts                Env + isConfigured guards
    google/                  OAuth2 client + Calendar wrapper (freebusy slots)
    store/                   tasks.ts (Supabase) + settings.ts (OAuth tokens)
    agent/                   tools.ts (definitions+executors) + runAgent.ts (loop)
    briefing.ts              Briefing composer
  components/                Dashboard UI (React)
supabase/migrations/         Postgres schema
```

The **agent** (`src/lib/agent`) is the core: OpenAI is given tools
(`list_calendar_events`, `find_free_slots`, `create_calendar_event`,
`update_calendar_event`, `create_task`, `schedule_task`, …). `runAgent` loops —
model calls tools, we execute them against Calendar/Supabase, feed results back —
until it returns a final answer. Chat, scheduling, time‑blocking, and
rescheduling all flow through this one loop.

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment (`.env.local`)

`OPENAI_API_KEY` and `GOOGLE_CALENDAR_API` are already filled in. You still need:

| Variable | How to get it |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → *Web application*. Under **Authorized redirect URIs** add `http://localhost:3000/api/auth/google/callback`. Enable the **Google Calendar API** for the project. |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page — the public *anon/publishable* key. Used by the login screen. |
| `ALLOWED_EMAILS` | Comma‑separated allow‑list of e‑mails permitted to sign in. Leave empty to allow any registered account (not recommended). |

> The plain `GOOGLE_CALENDAR_API` key only reads public calendars — reading and
> writing *your* calendar needs the OAuth credentials above.

### 3. Database

Run `supabase/migrations/0001_init.sql` against your Supabase project (SQL
editor, or `supabase db push`).

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000, click **Connect Google Calendar**, approve consent,
and start planning.

> On Google's OAuth consent screen while in "Testing" mode, add your Google
> account as a **Test user** (APIs & Services → OAuth consent screen).

### 5. Sign‑in (Supabase Auth)

The app sits behind a login screen at `/login` — Google sign‑in, or e‑mail +
password with sign‑up and password recovery.

1. Supabase → **Authentication → Providers → Google**: enable it, paste a Google
   OAuth client ID/secret, and copy the callback URL Supabase shows into that
   client's *Authorized redirect URIs* in Google Cloud Console.
   (This is a **separate** OAuth client concern from the Calendar connection —
   one signs you *into* the app, the other grants it *your calendar*.)
2. Supabase → **Authentication → URL Configuration**: set *Site URL* to your
   deployment and add `http://localhost:3000/auth/callback` plus
   `https://YOUR-APP/auth/callback` to *Redirect URLs*. Password‑recovery and
   confirmation e‑mails will not work otherwise.
3. Set `ALLOWED_EMAILS` to your own address. The sign‑up form is reachable by
   anyone; the allow‑list is what keeps the app yours.

> `NEXT_PUBLIC_*` variables are inlined at build time — after changing them on
> Vercel you must redeploy, not just restart.

When `NEXT_PUBLIC_SUPABASE_ANON_KEY` is absent the middleware **does not**
enforce login, so local development still works before the keys exist. Make sure
it is set in production.

## Security notes

- `.env.local` and `ai-planner.env` are git‑ignored. Never commit secrets.
- The OpenAI key is server‑only. Since it has been stored in plaintext, rotate
  it before deploying anywhere public.
- OAuth tokens are stored in the `app_settings` table via the service‑role key.
- `src/middleware.ts` gates every page and API route on a verified Supabase
  session (`getUser()`, not the unverified cookie) plus the e‑mail allow‑list.
- Response headers set `X-Robots-Tag: noindex…noai`, `X-Frame-Options: DENY`,
  `nosniff`, `no-referrer`, a restrictive `Permissions-Policy`, and HSTS.

## Not indexed, not trained on

The app is private and declares it three ways:

- `/robots.txt` (`src/app/robots.ts`) — `Disallow: /` for everyone, plus an
  explicit rule per AI crawler (GPTBot, ClaudeBot, Google‑Extended, CCBot,
  PerplexityBot, Bytespider, …), since several ignore a bare wildcard.
- `/ai.txt` and `/llms.txt` (`src/lib/aiPolicy.ts`) — a stated no‑training,
  no‑RAG, no‑citation policy.
- `X-Robots-Tag` headers plus `<meta name="robots">` on every response.

These are consent signals, honoured only by well‑behaved crawlers. The actual
protection is the login gate — nothing is reachable without a session.

## Roadmap

- Scheduled email briefings (cron) — dashboard version ships first.
- Multi‑user accounts + per‑user tokens (currently single‑user).
