-- Calyra user behavior timeline.
-- Replace either target_email or target_user_id below in each query block.

-- 1) User, customer, and subscription snapshot
with input as (
  select
    nullif('your_email@example.com', 'your_email@example.com')::text as target_email,
    null::uuid as target_user_id
),
target_user as (
  select au.*
  from auth.users au
  cross join input i
  where (i.target_user_id is not null and au.id = i.target_user_id)
     or (i.target_email is not null and au.email = lower(i.target_email))
)
select
  au.id as user_id,
  au.email,
  au.created_at as user_created_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  c.id as customer_id,
  c.credits,
  c.credits_balance,
  c.credits_used,
  c.created_at as customer_created_at,
  s.status as subscription_status,
  s.creem_product_id,
  s.current_period_start,
  s.current_period_end
from target_user au
left join public.customers c on c.user_id = au.id
left join public.subscriptions s on s.customer_id = c.id
order by s.created_at desc nulls last;

-- 2) Credit ledger
with input as (
  select
    nullif('your_email@example.com', 'your_email@example.com')::text as target_email,
    null::uuid as target_user_id
),
target_user as (
  select au.*
  from auth.users au
  cross join input i
  where (i.target_user_id is not null and au.id = i.target_user_id)
     or (i.target_email is not null and au.email = lower(i.target_email))
)
select
  ch.created_at,
  ch.type,
  ch.amount,
  ch.description,
  ch.metadata
from target_user au
join public.customers c on c.user_id = au.id
join public.credits_history ch on ch.customer_id = c.id
order by ch.created_at asc;

-- 3) Song generation records
with input as (
  select
    nullif('your_email@example.com', 'your_email@example.com')::text as target_email,
    null::uuid as target_user_id
),
target_user as (
  select au.*
  from auth.users au
  cross join input i
  where (i.target_user_id is not null and au.id = i.target_user_id)
     or (i.target_email is not null and au.email = lower(i.target_email))
)
select
  sg.created_at,
  sg.updated_at,
  sg.id as song_id,
  sg.title,
  sg.status,
  sg.style_key,
  sg.locale,
  sg.audio_provider,
  sg.audio_provider_status,
  sg.is_public,
  sg.play_count,
  sg.complete_count,
  sg.share_count,
  sg.like_count
from target_user au
join public.songs sg on sg.user_id = au.id
order by sg.created_at asc;

-- 4) Event timeline
with input as (
  select
    nullif('your_email@example.com', 'your_email@example.com')::text as target_email,
    null::uuid as target_user_id
),
target_user as (
  select au.*
  from auth.users au
  cross join input i
  where (i.target_user_id is not null and au.id = i.target_user_id)
     or (i.target_email is not null and au.email = lower(i.target_email))
)
select
  ue.created_at,
  ue.event_name,
  ue.pathname,
  ue.session_id,
  ue.properties
from target_user au
join public.user_events ue on ue.user_id = au.id
order by ue.created_at asc;

-- 5) Coarse funnel status
with input as (
  select
    nullif('your_email@example.com', 'your_email@example.com')::text as target_email,
    null::uuid as target_user_id
),
target_user as (
  select au.*
  from auth.users au
  cross join input i
  where (i.target_user_id is not null and au.id = i.target_user_id)
     or (i.target_email is not null and au.email = lower(i.target_email))
),
facts as (
  select
    au.id as user_id,
    exists (
      select 1 from public.user_events ue
      where ue.user_id = au.id and ue.event_name = 'generate_submit'
    ) as generated_clicked,
    exists (
      select 1 from public.songs sg
      where sg.user_id = au.id and sg.status = 'ready'
    ) as generated_successfully,
    exists (
      select 1 from public.user_events ue
      where ue.user_id = au.id
        and ue.event_name in (
          'workspace_song_play_clicked',
          'public_song_play_started'
        )
    ) or exists (
      select 1 from public.songs sg
      where sg.user_id = au.id and coalesce(sg.play_count, 0) > 0
    ) as played_song,
    exists (
      select 1 from public.user_events ue
      where ue.user_id = au.id and ue.event_name = 'song_share_clicked'
    ) or exists (
      select 1 from public.songs sg
      where sg.user_id = au.id and coalesce(sg.share_count, 0) > 0
    ) as shared_song,
    exists (
      select 1 from public.user_events ue
      where ue.user_id = au.id and ue.event_name = 'pricing_viewed'
    ) as viewed_pricing,
    exists (
      select 1 from public.user_events ue
      where ue.user_id = au.id
        and ue.event_name in ('checkout_start', 'checkout_redirect')
    ) as checkout_intent,
    exists (
      select 1
      from public.customers c
      join public.subscriptions s on s.customer_id = c.id
      where c.user_id = au.id and s.status in ('active', 'trialing')
    ) as subscribed
  from target_user au
)
select 'registered' as funnel_step, true as completed from facts
union all select 'generate_clicked', generated_clicked from facts
union all select 'generate_success', generated_successfully from facts
union all select 'played_song', played_song from facts
union all select 'shared_song', shared_song from facts
union all select 'pricing_viewed', viewed_pricing from facts
union all select 'checkout_intent', checkout_intent from facts
union all select 'subscribed', subscribed from facts;
