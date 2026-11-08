-- Organization onboarding: profiles, join requests, and GitHub repository links.
--
-- The application keeps the `teams` table name for compatibility; the product
-- surface calls these "organizations". `teams.slug` is the shareable
-- organization ID people use to request access.

-- ---------------------------------------------------------------------------
-- Profiles mirror auth.users so the app can show member names and email admins
-- without calling the auth admin API per row.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.sync_profile_from_auth_user();

insert into public.profiles (id, email, full_name, avatar_url)
select id,
       lower(coalesce(email, '')),
       nullif(raw_user_meta_data->>'full_name', ''),
       nullif(raw_user_meta_data->>'avatar_url', '')
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "Teammates can view profiles" on public.profiles;
create policy "Teammates can view profiles" on public.profiles
  for select using (exists (
    select 1
    from public.team_members as mine
    join public.team_members as theirs on theirs.team_id = mine.team_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  ));

-- ---------------------------------------------------------------------------
-- Join requests: a signed-in user asks to join an organization by its ID.
-- Owners and admins review them; at most one pending request per user/org.
-- ---------------------------------------------------------------------------
create table if not exists public.team_join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text check (message is null or char_length(message) <= 500),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists team_join_requests_one_pending_idx
  on public.team_join_requests (team_id, user_id)
  where status = 'pending';
create index if not exists team_join_requests_team_status_idx
  on public.team_join_requests (team_id, status, created_at);
create index if not exists team_join_requests_user_idx
  on public.team_join_requests (user_id, created_at desc);

alter table public.team_join_requests enable row level security;

drop policy if exists "Requesters can view their join requests" on public.team_join_requests;
create policy "Requesters can view their join requests" on public.team_join_requests
  for select using (user_id = auth.uid());

drop policy if exists "Admins can view team join requests" on public.team_join_requests;
create policy "Admins can view team join requests" on public.team_join_requests
  for select using (public.is_team_admin(team_join_requests.team_id));

-- ---------------------------------------------------------------------------
-- GitHub repositories linked to a project.
-- ---------------------------------------------------------------------------
create table if not exists public.project_repositories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  provider text not null default 'github' check (provider in ('github')),
  external_id bigint,
  full_name text not null,
  default_branch text not null,
  html_url text not null,
  description text,
  is_private boolean not null default false,
  linked_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, provider, full_name)
);

create index if not exists project_repositories_project_idx
  on public.project_repositories (project_id, created_at);
create index if not exists project_repositories_team_idx
  on public.project_repositories (team_id);

alter table public.project_repositories enable row level security;

drop policy if exists "Members can view project repositories" on public.project_repositories;
create policy "Members can view project repositories" on public.project_repositories
  for select using (public.is_team_member(project_repositories.team_id));

drop policy if exists "Members can link project repositories" on public.project_repositories;
create policy "Members can link project repositories" on public.project_repositories
  for insert with check (
    linked_by = auth.uid() and public.is_team_member(project_repositories.team_id)
  );

drop policy if exists "Admins can unlink project repositories" on public.project_repositories;
create policy "Admins can unlink project repositories" on public.project_repositories
  for delete using (public.is_team_admin(project_repositories.team_id));

-- ---------------------------------------------------------------------------
-- Supporting indexes for organization-scoped listings.
-- ---------------------------------------------------------------------------
create index if not exists projects_team_created_idx
  on public.projects (team_id, created_at desc);
create index if not exists test_runs_project_created_idx
  on public.test_runs (project_id, created_at desc);
