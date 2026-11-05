create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.test_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null check (status in ('queued', 'running', 'passed', 'failed', 'needs_review')),
  instruction text not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.test_runs(id) on delete cascade,
  title text not null,
  status text not null check (status in ('passed', 'failed', 'needs_review')),
  confidence numeric(5, 2),
  summary text not null,
  steps jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.test_runs enable row level security;
alter table public.test_results enable row level security;

create policy "Owners can manage projects" on public.projects
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "Project owners can manage runs" on public.test_runs
  for all using (exists (
    select 1 from public.projects where projects.id = test_runs.project_id and projects.owner_id = auth.uid()
  )) with check (exists (
    select 1 from public.projects where projects.id = test_runs.project_id and projects.owner_id = auth.uid()
  ));

create policy "Project owners can manage results" on public.test_results
  for all using (exists (
    select 1 from public.test_runs
    join public.projects on projects.id = test_runs.project_id
    where test_runs.id = test_results.run_id and projects.owner_id = auth.uid()
  )) with check (exists (
    select 1 from public.test_runs
    join public.projects on projects.id = test_runs.project_id
    where test_runs.id = test_results.run_id and projects.owner_id = auth.uid()
  ));
