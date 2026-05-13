alter table public.songs
  add column if not exists audio_provider text default 'kie',
  add column if not exists audio_provider_task_id text default '',
  add column if not exists audio_provider_status text;

update public.songs
set
  audio_provider = coalesce(audio_provider, 'kie'),
  audio_provider_task_id = case
    when coalesce(audio_provider_task_id, '') <> '' then audio_provider_task_id
    when coalesce(kie_task_id, '') <> '' then kie_task_id
    else ''
  end;

alter table public.songs
  alter column audio_provider set not null,
  alter column audio_provider_task_id set not null;

drop index if exists songs_audio_provider_task_idx;
create index songs_audio_provider_task_idx
  on public.songs(audio_provider, audio_provider_task_id);

alter table public.songs
  drop column if exists kie_task_id;
