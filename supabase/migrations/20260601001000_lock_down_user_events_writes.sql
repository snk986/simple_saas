drop policy if exists "Users can insert their own events" on public.user_events;

revoke insert, update, delete on public.user_events from authenticated;

grant select on public.user_events to authenticated;
grant all on public.user_events to service_role;
