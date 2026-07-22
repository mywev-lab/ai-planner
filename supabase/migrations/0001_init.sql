-- AI Planner — initial schema
--
-- This database is shared with the New Empire CRM, so every table this project
-- owns carries an `ai_planner_` prefix.
--
-- Single-user app: no per-user rows. The app reads and writes exclusively
-- through the service-role key from the Next.js server, which bypasses RLS.
-- RLS is nevertheless ENABLED with zero policies, so the public anon key —
-- which now ships to the browser for login — can read nothing here, including
-- the stored Google OAuth tokens.

-- Tasks -----------------------------------------------------------------
create table if not exists public.ai_planner_tasks (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  notes              text,
  status             text not null default 'pending'
                       check (status in ('pending','scheduled','done','cancelled')),
  priority           text not null default 'medium'
                       check (priority in ('low','medium','high','urgent')),
  estimated_minutes  integer,
  deadline           timestamptz,
  scheduled_event_id text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists ai_planner_tasks_status_idx   on public.ai_planner_tasks (status);
create index if not exists ai_planner_tasks_deadline_idx on public.ai_planner_tasks (deadline);

-- Key/value settings (stores Google OAuth tokens) ----------------------
create table if not exists public.ai_planner_settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);

-- Lock-down -------------------------------------------------------------
alter table public.ai_planner_tasks    enable row level security;
alter table public.ai_planner_settings enable row level security;

revoke all on public.ai_planner_tasks    from anon, authenticated;
revoke all on public.ai_planner_settings from anon, authenticated;
