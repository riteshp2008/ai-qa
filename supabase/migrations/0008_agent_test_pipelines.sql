-- Agentic test pipelines: a multi-agent workflow that containerizes a linked
-- GitHub repository in a sandbox, generates and runs E2E/API/unit tests, waits
-- for human approval, and opens a pull request with the verified tests.

create table if not exists public.agent_pipelines (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  repository_id uuid not null references public.project_repositories(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in (
    'queued', 'provisioning', 'analyzing', 'containerizing', 'awaiting_input',
    'generating', 'verifying', 'awaiting_approval', 'creating_pr',
    'completed', 'failed', 'rejected', 'cancelled'
  )),
  suites text[] not null default array['e2e', 'api', 'unit'],
  instructions text check (instructions is null or char_length(instructions) <= 4000),
  base_branch text,
  sandbox_id text,
  -- Analyzer output (stack, commands, port, frameworks) used as shared agent context.
  app_profile jsonb,
  -- Per-suite verification results and reviewer verdicts.
  results jsonb not null default '{}'::jsonb,
  review_round integer not null default 0,
  pr_url text,
  pr_number integer,
  pr_branch text,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_pipelines_project_created_idx
  on public.agent_pipelines (project_id, created_at desc);
create index if not exists agent_pipelines_team_status_idx
  on public.agent_pipelines (team_id, status);

-- Append-only timeline of agent activity (stage changes, tool calls, guardrail hits, HITL).
create table if not exists public.agent_pipeline_events (
  id bigint generated always as identity primary key,
  pipeline_id uuid not null references public.agent_pipelines(id) on delete cascade,
  agent text not null,
  kind text not null check (kind in ('stage', 'thought', 'tool', 'result', 'guardrail', 'review', 'hitl', 'error')),
  message text not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_pipeline_events_pipeline_idx
  on public.agent_pipeline_events (pipeline_id, id);

-- Files the agents produced; the PR is built from these, never from the sandbox directly.
create table if not exists public.agent_artifacts (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.agent_pipelines(id) on delete cascade,
  path text not null,
  kind text not null check (kind in ('dockerfile', 'e2e', 'api', 'unit', 'config', 'dependency')),
  agent text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pipeline_id, path)
);

-- Human-in-the-loop decisions.
create table if not exists public.agent_reviews (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.agent_pipelines(id) on delete cascade,
  decision text not null check (decision in ('approve', 'request_changes', 'reject')),
  feedback text check (feedback is null or char_length(feedback) <= 4000),
  decided_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists agent_reviews_pipeline_idx on public.agent_reviews (pipeline_id, created_at);

alter table public.agent_pipelines enable row level security;
alter table public.agent_pipeline_events enable row level security;
alter table public.agent_artifacts enable row level security;
alter table public.agent_reviews enable row level security;

drop policy if exists "Members can view pipelines" on public.agent_pipelines;
create policy "Members can view pipelines" on public.agent_pipelines
  for select using (public.is_team_member(agent_pipelines.team_id));

drop policy if exists "Members can view pipeline events" on public.agent_pipeline_events;
create policy "Members can view pipeline events" on public.agent_pipeline_events
  for select using (exists (
    select 1 from public.agent_pipelines p
    where p.id = agent_pipeline_events.pipeline_id and public.is_team_member(p.team_id)
  ));

drop policy if exists "Members can view artifacts" on public.agent_artifacts;
create policy "Members can view artifacts" on public.agent_artifacts
  for select using (exists (
    select 1 from public.agent_pipelines p
    where p.id = agent_artifacts.pipeline_id and public.is_team_member(p.team_id)
  ));

drop policy if exists "Members can view reviews" on public.agent_reviews;
create policy "Members can view reviews" on public.agent_reviews
  for select using (exists (
    select 1 from public.agent_pipelines p
    where p.id = agent_reviews.pipeline_id and public.is_team_member(p.team_id)
  ));
