-- Phase 4 Task 16: entitlements, credit ledger, and storage lifecycle

alter table public.songs
  drop constraint if exists songs_status_check;

alter table public.songs
  add constraint songs_status_check
  check (status in ('draft', 'generating', 'ready', 'failed', 'expired'));

create index if not exists songs_expires_at_idx
  on public.songs(expires_at)
  where expires_at is not null;

drop function if exists public.freeze_credit(uuid, integer);

create or replace function public.freeze_credit(
  p_user_id uuid,
  p_amount integer default 100,
  p_description text default 'Credit spend',
  p_metadata jsonb default '{}'::jsonb
)
returns json as $$
declare
  v_customer_id uuid;
  v_new_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Credit amount must be positive';
  end if;

  if auth.role() <> 'service_role' and auth.uid() <> p_user_id then
    raise exception 'Unauthorized credit operation';
  end if;

  update public.customers
  set
    credits_balance = credits_balance - p_amount,
    credits = greatest(coalesce(credits, credits_balance) - p_amount, 0),
    credits_used = credits_used + p_amount,
    updated_at = now()
  where user_id = p_user_id
    and credits_balance >= p_amount
  returning id, credits_balance into v_customer_id, v_new_balance;

  if found then
    insert into public.credits_history (
      customer_id,
      amount,
      type,
      description,
      metadata
    ) values (
      v_customer_id,
      p_amount,
      'subtract',
      coalesce(p_description, 'Credit spend'),
      coalesce(p_metadata, '{}'::jsonb)
    );

    return json_build_object('enough', true, 'balance', v_new_balance);
  end if;

  return json_build_object('enough', false);
end;
$$ language plpgsql security definer set search_path = public;

drop function if exists public.unfreeze_credit(uuid, integer);

create or replace function public.unfreeze_credit(
  p_user_id uuid,
  p_amount integer default 100,
  p_description text default 'Credit refund',
  p_metadata jsonb default '{}'::jsonb
)
returns json as $$
declare
  v_customer_id uuid;
  v_new_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Credit amount must be positive';
  end if;

  if auth.role() <> 'service_role' and auth.uid() <> p_user_id then
    raise exception 'Unauthorized credit operation';
  end if;

  update public.customers
  set
    credits_balance = credits_balance + p_amount,
    credits = coalesce(credits, 0) + p_amount,
    credits_used = greatest(credits_used - p_amount, 0),
    updated_at = now()
  where user_id = p_user_id
  returning id, credits_balance into v_customer_id, v_new_balance;

  if found then
    insert into public.credits_history (
      customer_id,
      amount,
      type,
      description,
      metadata
    ) values (
      v_customer_id,
      p_amount,
      'add',
      coalesce(p_description, 'Credit refund'),
      coalesce(p_metadata, '{}'::jsonb)
    );
  end if;

  return json_build_object('balance', coalesce(v_new_balance, 0));
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.freeze_credit(uuid, integer, text, jsonb)
  to authenticated, service_role;

grant execute on function public.unfreeze_credit(uuid, integer, text, jsonb)
  to authenticated, service_role;
