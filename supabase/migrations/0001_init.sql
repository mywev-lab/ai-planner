-- AI Planner — initial schema
-- Single-user app: no per-user rows. Access is via the service-role key from
-- the Next.js server only, so row-level security is left disabled here.

-- Tasks -----------------------------------------------------------------
create table if not exists public.tasks (
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

create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_deadline_idx on public.tasks (deadline);

-- Key/value settings (stores Google OAuth tokens) ----------------------
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz not null default now()
);
