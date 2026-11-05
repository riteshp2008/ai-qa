alter table public.test_runs
  add column if not exists target_url text;

alter table public.test_runs
  drop constraint if exists test_runs_status_check;

alter table public.test_runs
  add constraint test_runs_status_check
  check (status in ('queued', 'running', 'retry_wait', 'passed', 'failed', 'needs_review', 'cancelled'));

create unique index if not exists outbox_events_aggregate_event
  on public.outbox_events (aggregate_id, event_name);

create or replace function public.set_test_run_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists test_runs_set_updated_at on public.test_runs;
create trigger test_runs_set_updated_at
before update on public.test_runs
for each row execute function public.set_test_run_updated_at();

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
    select 1 from public.projects
    where id = p_project_id and owner_id = v_owner_id
  ) then
    raise exception using errcode = 'P0001', message = 'Project is not owned by the authenticated user or target URL is outside its scope.';
  end if;

  select * into v_existing
  from public.test_runs
  where project_id = p_project_id and idempotency_key = p_idempotency_key
  limit 1;

  if v_existing.id is not null then
    if v_existing.request_hash <> p_request_hash then
      raise exception using errcode = 'P0001', message = 'Idempotency key was already used for a different request.';
    end if;

    select * into v_outbox
    from public.outbox_events
    where aggregate_id = v_existing.id and event_name = 'sentinel/test-run.accepted'
    limit 1;

    select * into v_attempt
    from public.test_run_attempts
    where run_id = v_existing.id and attempt_number = v_existing.current_attempt
    limit 1;

    return jsonb_build_object(
      'run', to_jsonb(v_existing),
      'attempt', to_jsonb(v_attempt),
      'outbox_id', v_outbox.id,
      'created', false
    );
  end if;

  insert into public.test_runs (
    project_id, owner_id, status, instruction, target_url,
    idempotency_key, request_hash, current_attempt
  )
  values (
    p_project_id, v_owner_id, 'queued', p_instruction, p_url,
    p_idempotency_key, p_request_hash, 1
  )
  returning * into v_run;

  insert into public.test_run_attempts (run_id, attempt_number, status)
  values (v_run.id, 1, 'queued')
  returning * into v_attempt;

  insert into public.outbox_events (aggregate_id, event_name, payload)
  values (
    v_run.id,
    'sentinel/test-run.accepted',
    jsonb_set(
      jsonb_set(p_event_payload, '{runId}', to_jsonb(v_run.id::text)),
      '{attemptId}', to_jsonb(v_attempt.id::text)
    )
  )
  returning * into v_outbox;

  return jsonb_build_object(
    'run', to_jsonb(v_run),
    'attempt', to_jsonb(v_attempt),
    'outbox_id', v_outbox.id,
    'created', true
  );
end;
$$;

revoke all on function public.create_test_run(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.create_test_run(uuid, text, text, text, text, jsonb) to authenticated;
