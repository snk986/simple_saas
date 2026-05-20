alter table public.songs
  add column if not exists source_type text not null default 'ai_generated',
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_rank integer,
  add column if not exists featured_artist text,
  add column if not exists featured_badge text,
  add column if not exists featured_active boolean not null default true,
  add column if not exists featured_at timestamptz;

create index if not exists songs_home_featured_idx
  on public.songs(featured_rank, featured_at desc, created_at desc)
  where is_public = true
    and status = 'ready'
    and is_featured = true
    and featured_active = true;
