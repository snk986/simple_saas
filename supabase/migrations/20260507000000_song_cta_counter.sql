alter table public.songs
  add column if not exists cta_click_count integer default 0;

create or replace function public.increment_song_counter(
  p_song_id uuid,
  p_counter text
)
returns void as $$
begin
  if p_counter = 'play_count' then
    update public.songs set play_count = play_count + 1, updated_at = now() where id = p_song_id;
  elsif p_counter = 'complete_count' then
    update public.songs set complete_count = complete_count + 1, updated_at = now() where id = p_song_id;
  elsif p_counter = 'share_count' then
    update public.songs set share_count = share_count + 1, updated_at = now() where id = p_song_id;
  elsif p_counter = 'like_count' then
    update public.songs set like_count = like_count + 1, updated_at = now() where id = p_song_id;
  elsif p_counter = 'cta_click_count' then
    update public.songs set cta_click_count = cta_click_count + 1, updated_at = now() where id = p_song_id;
  end if;
end;
$$ language plpgsql security definer;
