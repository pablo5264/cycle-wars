create table if not exists public.event_reminders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  remind_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'cancelled', 'sent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, player_id)
);

create index if not exists event_reminders_player_status_idx
on public.event_reminders(player_id, status, remind_at);

create index if not exists event_reminders_due_idx
on public.event_reminders(status, remind_at)
where status = 'active';

alter table public.event_reminders enable row level security;

drop policy if exists "players can read own event reminders" on public.event_reminders;
create policy "players can read own event reminders"
on public.event_reminders for select
to authenticated
using (player_id = auth.uid());

drop policy if exists "players can manage own event reminders" on public.event_reminders;
create policy "players can manage own event reminders"
on public.event_reminders for all
to authenticated
using (player_id = auth.uid())
with check (player_id = auth.uid());

create or replace function public.touch_event_reminder_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists event_reminders_touch_updated_at on public.event_reminders;
create trigger event_reminders_touch_updated_at
before update on public.event_reminders
for each row execute function public.touch_event_reminder_updated_at();

create or replace view public.v_player_event_reminders as
select
  reminders.id,
  reminders.event_id,
  events.code as event_code,
  events.name as event_name,
  events.scope,
  reminders.player_id,
  reminders.remind_at,
  reminders.status,
  reminders.created_at,
  reminders.updated_at
from public.event_reminders reminders
join public.events on events.id = reminders.event_id;
