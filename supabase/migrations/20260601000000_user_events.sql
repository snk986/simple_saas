create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  pathname text,
  session_id text,
  created_at timestamptz not null default now(),
  constraint user_events_event_name_length check (
    char_length(event_name) between 1 and 80
  ),
  constraint user_events_pathname_length check (
    pathname is null or char_length(pathname) <= 300
  ),
  constraint user_events_session_id_length check (
    session_id is null or char_length(session_id) <= 120
  )
);

create index if not exists user_events_user_created_at_idx
  on public.user_events(user_id, created_at desc);

create index if not exists user_events_event_name_idx
  on public.user_events(event_name);

create index if not exists user_events_created_at_idx
  on public.user_events(created_at desc);

alter table public.user_events enable row level security;

drop policy if exists "Users can view their own events" on public.user_events;
create policy "Users can view their own events"
  on public.user_events for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage user events" on public.user_events;
create policy "Service role can manage user events"
  on public.user_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

grant select on public.user_events to authenticated;
revoke insert, update, delete on public.user_events from authenticated;
grant all on public.user_events to service_role;
