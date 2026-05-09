-- Allow logged-in users to operate on their own songs through RLS policies.
grant select, insert, update, delete on public.songs to authenticated;
grant select on public.achievements to authenticated;

drop policy if exists "Users can manage own songs" on public.songs;

create policy "Users can manage own songs"
  on public.songs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
