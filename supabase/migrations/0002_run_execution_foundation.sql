alter table public.test_runs
  add column if not exists idempotency_key text,
  add column if not exists request_hash text,
  add column if not exists owner_id uuid references auth.users(id),
  add column if not exists current_attempt integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

update public.test_runs
set owner_id = projects.owner_id
from public.projects
where public.test_runs.project_id = public.projects.id
  and public.test_runs.owner_id is null;

alter table public.test_runs
  alter column owner_id set not null;

create unique index if not exists test_runs_project_idempotency_key
  on public.test_runs (project_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.test_run_attempts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.test_runs(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status text not null check (status in ('queued', 'running', 'retry_wait', 'passed', 'failed', 'needs_review', 'cancelled')),
  error_class text,
  retry_reason text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (run_id, attempt_number)
);

create table if not exists public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  aggregate_id uuid not null references public.test_runs(id) on delete cascade,
  event_name text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists outbox_events_pending
  on public.outbox_events (status, created_at);

alter table public.test_run_attempts enable row level security;
alter table public.outbox_events enable row level security;

create policy "Project owners can manage attempts" on public.test_run_attempts
  for all using (exists (
    select 1 from public.test_runs
    join public.projects on projects.id = test_runs.project_id
    where test_runs.id = test_run_attempts.run_id and projects.owner_id = auth.uid()
  ));

create policy "Project owners can view outbox events" on public.outbox_events
  for select using (exists (
    select 1 from public.test_runs
    join public.projects on projects.id = test_runs.project_id
    where test_runs.id = outbox_events.aggregate_id and projects.owner_id = auth.uid()
  ));
