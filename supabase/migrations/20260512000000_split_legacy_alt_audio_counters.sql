insert into public.songs (
  user_id,
  title,
  lyrics,
  user_input,
  audio_url,
  selected_audio,
  cover_url,
  lyrics_regen_count,
  style_key,
  style_params,
  style_tags,
  locale,
  status,
  is_public,
  expires_at,
  created_at,
  updated_at
)
select
  src.user_id,
  src.title || ' (Version B)',
  src.lyrics,
  src.user_input,
  src.audio_url_alt,
  'primary',
  src.cover_url,
  src.lyrics_regen_count,
  src.style_key,
  src.style_params,
  src.style_tags,
  src.locale,
  src.status,
  src.is_public,
  src.expires_at,
  src.created_at,
  now()
from public.songs as src
where src.audio_url_alt is not null
  and src.status = 'ready'
  and not exists (
    select 1
    from public.songs as dst
    where dst.user_id = src.user_id
      and dst.audio_url = src.audio_url_alt
      and dst.status = 'ready'
  );

update public.songs
set
  audio_url_alt = null,
  selected_audio = 'primary',
  updated_at = now()
where audio_url_alt is not null
  and status = 'ready';
