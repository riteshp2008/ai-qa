create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.projects
  add column if not exists team_id uuid references public.teams(id) on delete cascade;

insert into public.teams (name, slug, created_by)
select coalesce(raw_user.raw_user_meta_data->>'full_name', split_part(raw_user.email, '@', 1)) || '''s workspace',
       'workspace-' || replace(raw_user.id::text, '-', ''),
       raw_user.id
from auth.users as raw_user
on conflict (slug) do nothing;

insert into public.team_members (team_id, user_id, role)
select teams.id, teams.created_by, 'owner'
from public.teams
on conflict (team_id, user_id) do nothing;

update public.projects
set team_id = teams.id
from public.teams
where projects.owner_id = teams.created_by
  and projects.team_id is null;

alter table public.projects
  alter column team_id set not null;

create index if not exists team_members_user_id on public.team_members(user_id);
create index if not exists team_invites_team_status on public.team_invites(team_id, status);
create index if not exists projects_team_id on public.projects(team_id);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;

create or replace function public.is_team_member(p_team_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = p_user_id
  );
$$;

create or replace function public.is_team_admin(p_team_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = p_user_id
      and role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_team_member(uuid, uuid) from public;
grant execute on function public.is_team_member(uuid, uuid) to authenticated, service_role;
revoke all on function public.is_team_admin(uuid, uuid) from public;
grant execute on function public.is_team_admin(uuid, uuid) to authenticated, service_role;

drop policy if exists "Owners can manage projects" on public.projects;
drop policy if exists "Project owners can manage runs" on public.test_runs;
drop policy if exists "Project owners can manage results" on public.test_results;

create policy "Team members can view teams" on public.teams
  for select using (public.is_team_member(teams.id));

create policy "Team admins can update teams" on public.teams
  for update using (public.is_team_admin(teams.id));

create policy "Members can view team membership" on public.team_members
  for select using (public.is_team_member(team_members.team_id));

create policy "Admins can manage team membership" on public.team_members
  for all using (public.is_team_admin(team_members.team_id))
  with check (public.is_team_admin(team_members.team_id));

create policy "Members can view team invites" on public.team_invites
  for select using (public.is_team_member(team_invites.team_id));

create policy "Admins can create team invites" on public.team_invites
  for insert with check (public.is_team_admin(team_invites.team_id) and invited_by = auth.uid());

create policy "Admins can update team invites" on public.team_invites
  for update using (public.is_team_admin(team_invites.team_id));

create policy "Members can view projects" on public.projects
  for select using (public.is_team_member(projects.team_id));

create policy "Members can create projects" on public.projects
  for insert with check (
    owner_id = auth.uid() and public.is_team_member(projects.team_id)
  );

create policy "Admins can update projects" on public.projects
  for update using (public.is_team_admin(projects.team_id));

create policy "Admins can delete projects" on public.projects
  for delete using (public.is_team_admin(projects.team_id));

create policy "Team members can manage runs" on public.test_runs
  for all using (exists (
    select 1 from public.projects
    where projects.id = test_runs.project_id and public.is_team_member(projects.team_id)
  )) with check (exists (
    select 1 from public.projects
    where projects.id = test_runs.project_id and public.is_team_member(projects.team_id)
  ));

create policy "Team members can manage results" on public.test_results
  for all using (exists (
    select 1 from public.test_runs
    join public.projects on projects.id = test_runs.project_id
    where test_runs.id = test_results.run_id and public.is_team_member(projects.team_id)
  )) with check (exists (
    select 1 from public.test_runs
    join public.projects on projects.id = test_runs.project_id
    where test_runs.id = test_results.run_id and public.is_team_member(projects.team_id)
  ));

create or replace function public.create_test_run(
  p_project_id uuid,
  p_url text,
  p_instruction text,
  p_idempotency_key text,
  p_request_hash text,
  p_event_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
  v_existing public.test_runs;
  v_run public.test_runs;
  v_attempt public.test_run_attempts;
  v_outbox public.outbox_events;
begin
  if v_owner_id is null then
    raise exception using errcode = 'P0001', message = 'Authentication required.';
  end if;

  if not exists (
    select 1
    from public.projects
    join public.team_members on team_members.team_id = projects.team_id
    where projects.id = p_project_id and team_members.user_id = v_owner_id
  ) then
    raise exception using errcode = 'P0001', message = 'Project is not accessible to the authenticated user.';
  end if;

  select * into v_existing from public.test_runs
  where project_id = p_project_id and idempotency_key = p_idempotency_key limit 1;

  if v_existing.id is not null then
    if v_existing.request_hash <> p_request_hash then
      raise exception using errcode = 'P0001', message = 'Idempotency key was already used for a different request.';
    end if;
    select * into v_outbox from public.outbox_events
    where aggregate_id = v_existing.id and event_name = 'sentinel/test-run.accepted' limit 1;
    select * into v_attempt from public.test_run_attempts
    where run_id = v_existing.id and attempt_number = v_existing.current_attempt limit 1;
    return jsonb_build_object('run', to_jsonb(v_existing), 'attempt', to_jsonb(v_attempt),
      'outbox_id', v_outbox.id, 'outbox_status', v_outbox.status, 'created', false);
  end if;

  insert into public.test_runs (project_id, owner_id, status, instruction, target_url,
    idempotency_key, request_hash, current_attempt)
  values (p_project_id, v_owner_id, 'queued', p_instruction, p_url,
    p_idempotency_key, p_request_hash, 1)
  returning * into v_run;

  insert into public.test_run_attempts (run_id, attempt_number, status)
  values (v_run.id, 1, 'queued') returning * into v_attempt;

  insert into public.outbox_events (aggregate_id, event_name, payload)
  values (v_run.id, 'sentinel/test-run.accepted',
    jsonb_set(jsonb_set(p_event_payload, '{runId}', to_jsonb(v_run.id::text)),
      '{attemptId}', to_jsonb(v_attempt.id::text)))
  returning * into v_outbox;

  return jsonb_build_object('run', to_jsonb(v_run), 'attempt', to_jsonb(v_attempt),
    'outbox_id', v_outbox.id, 'outbox_status', v_outbox.status, 'created', true);
end;
$$;
