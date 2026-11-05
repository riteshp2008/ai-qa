create or replace function public.mark_test_run_needs_review(
  p_run_id uuid,
  p_attempt_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.test_runs
    where id = p_run_id and status = 'needs_review'
  ) then
    return;
  end if;

  update public.test_runs
  set status = 'needs_review',
      completed_at = now()
  where id = p_run_id
    and status = 'queued';

  if not found then
    raise exception using errcode = 'P0001', message = 'Test run is no longer queued.';
  end if;

  update public.test_run_attempts
  set status = 'needs_review',
      error_class = 'execution_not_available',
      retry_reason = p_reason,
      completed_at = now()
  where id = p_attempt_id
    and run_id = p_run_id
    and status = 'queued';

  if not found then
    raise exception using errcode = 'P0001', message = 'Test run attempt is no longer queued.';
  end if;
end;
$$;

revoke all on function public.mark_test_run_needs_review(uuid, uuid, text) from public;
grant execute on function public.mark_test_run_needs_review(uuid, uuid, text) to service_role;
