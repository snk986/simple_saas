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
  user_id,
  title || ' (Version B)',
  lyrics,
  user_input,
  audio_url_alt,
  'primary',
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
  now()
from public.songs
where audio_url_alt is not null
  and status = 'ready';

update public.songs
set
  audio_url_alt = null,
  selected_audio = 'primary',
  updated_at = now()
where audio_url_alt is not null;
