create extension if not exists vector;

create table if not exists public.repository_documents (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  repository_full_name text not null,
  path text not null,
  revision text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (repository_full_name, revision, path)
);

create index if not exists repository_documents_lookup_idx
  on public.repository_documents (team_id, repository_full_name, revision);

create index if not exists repository_documents_embedding_idx
  on public.repository_documents using hnsw (embedding vector_cosine_ops)
  where embedding is not null;

alter table public.repository_documents enable row level security;

create policy "Team members can view repository documents"
  on public.repository_documents for select
  using (public.is_team_member(team_id));

create policy "Team members can insert repository documents"
  on public.repository_documents for insert
  with check (public.is_team_member(team_id));

create policy "Team admins can update repository documents"
  on public.repository_documents for update
  using (public.is_team_admin(team_id))
  with check (public.is_team_admin(team_id));

create policy "Team admins can delete repository documents"
  on public.repository_documents for delete
  using (public.is_team_admin(team_id));
