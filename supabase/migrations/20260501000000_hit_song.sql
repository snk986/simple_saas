-- Hit-Song tables migration
-- Run after existing init schema

-- Songs table
create table public.songs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  lyrics        text not null,
  user_input    text not null,
  audio_url     text,
  audio_url_alt text,
  selected_audio text default 'primary'
    check (selected_audio in ('primary', 'alt')),
  cover_url     text,
  lyrics_regen_count integer default 0,
  style_key     text not null,
  style_params  jsonb not null default '{}',
  style_tags    text[] default '{}',
  locale        text not null default 'en',
  status        text not null default 'draft'
    check (status in ('draft', 'generating', 'ready', 'failed')),
  is_public     boolean default true,
  total_score   integer,
  report_data   jsonb,
  kie_task_id   text,
  play_count    integer default 0,
  share_count   integer default 0,
  like_count    integer default 0,
  expires_at    timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Achievements table
create table public.achievements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  achievement  text not null,
  unlocked_at  timestamptz default now(),
  unique(user_id, achievement)
);

-- Email log table
create table public.email_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  email_type text not null,
  sent_at    timestamptz default now()
);

-- Indexes
create index songs_user_id_idx on public.songs(user_id);
create index songs_status_idx on public.songs(status);
create index songs_is_public_idx on public.songs(is_public) where is_public = true;
create index songs_created_at_idx on public.songs(created_at desc);
create index achievements_user_id_idx on public.achievements(user_id);
create index email_log_user_id_idx on public.email_log(user_id);
create index email_log_sent_at_idx on public.email_log(sent_at);

-- Increment song counter RPC
create or replace function public.increment_song_counter(
  p_song_id uuid,
  p_counter text
)
returns void as $$
begin
  if p_counter = 'play_count' then
    update public.songs set play_count = play_count + 1, updated_at = now() where id = p_song_id;
  elsif p_counter = 'share_count' then
    update public.songs set share_count = share_count + 1, updated_at = now() where id = p_song_id;
  elsif p_counter = 'like_count' then
    update public.songs set like_count = like_count + 1, updated_at = now() where id = p_song_id;
  end if;
end;
$$ language plpgsql security definer;

-- Freeze credit (atomic deduct)
create or replace function public.freeze_credit(
  p_user_id uuid,
  p_amount integer default 100
)
returns json as $$
declare
  v_new_balance integer;
begin
  update public.customers
  set
    credits_balance = credits_balance - p_amount,
    credits_used = credits_used + p_amount,
    updated_at = now()
  where user_id = p_user_id
    and credits_balance >= p_amount
  returning credits_balance into v_new_balance;

  if found then
    return json_build_object('enough', true, 'balance', v_new_balance);
  else
    return json_build_object('enough', false);
  end if;
end;
$$ language plpgsql security definer;

-- Unfreeze credit (refund on failure)
create or replace function public.unfreeze_credit(
  p_user_id uuid,
  p_amount integer default 1
)
returns void as $$
begin
  update public.customers
  set
    credits_balance = credits_balance + p_amount,
    credits_used = greatest(credits_used - p_amount, 0),
    updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- RLS
alter table public.songs enable row level security;
alter table public.achievements enable row level security;
alter table public.email_log enable row level security;

create policy "Users can manage own songs"
  on public.songs for all using (auth.uid() = user_id);

create policy "Public songs are viewable by anyone"
  on public.songs for select using (is_public = true);

create policy "Users can view own achievements"
  on public.achievements for select using (auth.uid() = user_id);

create policy "Service role manages achievements"
  on public.achievements for all using (auth.role() = 'service_role');

create policy "Service role manages email log"
  on public.email_log for all using (auth.role() = 'service_role');

-- Grants
grant all on public.songs to service_role;
grant all on public.achievements to service_role;
grant all on public.email_log to service_role;

-- Dev: set all existing users to 9999 credits_balance
-- Only run in development environment
update public.customers set credits_balance = 9999 where true;
