create table public.edge_function_logs (
  id bigint generated always as identity primary key,
  request_id uuid not null default gen_random_uuid(),
  function_name text not null,
  user_id uuid references public.player_profiles(id) on delete set null,
  status_code integer not null check (status_code between 100 and 599),
  duration_ms integer not null check (duration_ms >= 0),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  bucket text not null,
  subject text not null,
  occurred_at timestamptz not null default now()
);

create table public.mobile_performance_events (
  id bigint generated always as identity primary key,
  player_id uuid references public.player_profiles(id) on delete set null,
  event_name text not null,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index edge_function_logs_function_time_idx
on public.edge_function_logs(function_name, created_at desc);

create index edge_function_logs_user_time_idx
on public.edge_function_logs(user_id, created_at desc);

create index rate_limit_events_bucket_subject_time_idx
on public.rate_limit_events(bucket, subject, occurred_at desc);

create index mobile_performance_events_player_time_idx
on public.mobile_performance_events(player_id, created_at desc);

create index gps_samples_recent_h3_trusted_idx
on public.gps_samples(h3_index, recorded_at desc)
where status = 'trusted';

create index territories_updated_status_idx
on public.territories(updated_at desc, status);

create index feed_posts_recent_public_idx
on public.feed_posts(created_at desc)
where visibility = 'public';

alter table public.edge_function_logs enable row level security;
alter table public.rate_limit_events enable row level security;
alter table public.mobile_performance_events enable row level security;

create policy "players can read own mobile performance events"
on public.mobile_performance_events for select
to authenticated
using (player_id = auth.uid());

create or replace function public.record_edge_function_log(
  p_function_name text,
  p_user_id uuid,
  p_status_code integer,
  p_duration_ms integer,
  p_error_message text,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.edge_function_logs (
    function_name,
    user_id,
    status_code,
    duration_ms,
    error_message,
    metadata
  )
  values (
    p_function_name,
    p_user_id,
    p_status_code,
    p_duration_ms,
    p_error_message,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.check_rate_limit(
  p_bucket text,
  p_subject text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  delete from public.rate_limit_events
  where occurred_at < now() - make_interval(secs => greatest(p_window_seconds, 1) * 4);

  select count(*)
  into recent_count
  from public.rate_limit_events
  where bucket = p_bucket
    and subject = p_subject
    and occurred_at >= now() - make_interval(secs => greatest(p_window_seconds, 1));

  if recent_count >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_events (bucket, subject)
  values (p_bucket, p_subject);

  return true;
end;
$$;

create or replace function public.record_mobile_performance_event(
  p_player_id uuid,
  p_event_name text,
  p_duration_ms integer,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.mobile_performance_events (
    player_id,
    event_name,
    duration_ms,
    metadata
  )
  values (
    p_player_id,
    p_event_name,
    p_duration_ms,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace view public.v_operational_health as
select
  now() as checked_at,
  (select count(*) from public.player_profiles) as player_count,
  (select count(*) from public.activities where created_at > now() - interval '1 hour') as activities_last_hour,
  (select count(*) from public.gps_samples where created_at > now() - interval '15 minutes') as gps_samples_last_15m,
  (select count(*) from public.territories where updated_at > now() - interval '15 minutes') as territories_updated_last_15m,
  (select count(*) from public.edge_function_logs where status_code >= 500 and created_at > now() - interval '15 minutes') as function_errors_last_15m;

revoke execute on function public.record_edge_function_log(text, uuid, integer, integer, text, jsonb) from public, anon, authenticated;
revoke execute on function public.check_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.record_mobile_performance_event(uuid, text, integer, jsonb) from public, anon, authenticated;

grant execute on function public.record_edge_function_log(text, uuid, integer, integer, text, jsonb) to service_role;
grant execute on function public.check_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.record_mobile_performance_event(uuid, text, integer, jsonb) to service_role;
